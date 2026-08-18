import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * @swagger
 * /api/jobs/{id}/photos:
 *   post:
 *     summary: Upload photos for a job
 *     description: Upload one or more photos for a job. Can set one as cover image.
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               coverImageId:
 *                 type: string
 *                 description: ID of the photo to set as cover (optional)
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot upload photos for this job
 *       404:
 *         description: Job not found
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Create response object for cookie handling
    let response = NextResponse.json({});

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get job to verify ownership
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("homeowner_id, contractor_id, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify user owns the job
    if (job.homeowner_id !== user.id) {
      return NextResponse.json(
        { error: "You can only upload photos for your own jobs" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const coverFileName = formData.get("coverFileName") as string | null;

    console.log("Photo upload request received:", {
      jobId,
      fileCount: files.length,
      coverFileName,
      fileNames: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
    });

    if (!files || files.length === 0) {
      console.error("No files in request");
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400, headers: response.headers }
      );
    }

    const uploadedPhotos = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      console.log("Processing file:", file.name, "Size:", file.size, "Type:", file.type);
      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.warn("Skipping non-image file:", file.name, file.type);
        skippedFiles.push(`${file.name} (not an image)`);
        continue; // Skip non-image files
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.warn("Skipping file that's too large:", file.name, file.size);
        skippedFiles.push(`${file.name} (exceeds 5MB)`);
        continue; // Skip files that are too large
      }

      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${jobId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("job-photos")
        .upload(filePath, file, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload error for file:", file.name, uploadError);
        // Return error details instead of silently skipping
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          { status: 500, headers: response.headers }
        );
      }

      // Create database record
      const { data: photo, error: dbError } = await supabase
        .from("job_photos")
        .insert({
          job_id: jobId,
          uploaded_by: user.id,
          storage_path: filePath,
          storage_bucket: "job-photos",
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          is_cover: false, // Will be set below if this is the cover
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error for file:", file.name, dbError);
        // Try to delete the uploaded file
        await supabase.storage.from("job-photos").remove([filePath]);
        return NextResponse.json(
          { error: `Failed to save photo record: ${dbError.message}` },
          { status: 500, headers: response.headers }
        );
      }

      uploadedPhotos.push(photo);
      console.log("Successfully uploaded photo:", photo.id, file.name);
    }

    // If no photos were uploaded, return an error
    if (uploadedPhotos.length === 0) {
      const errorMessage = skippedFiles.length > 0
        ? `No valid photos uploaded. Skipped: ${skippedFiles.join(", ")}`
        : "No photos were uploaded";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400, headers: response.headers }
      );
    }

    console.log(`Successfully uploaded ${uploadedPhotos.length} photo(s)`);

    // Handle cover image setting by file name
    if (coverFileName && uploadedPhotos.length > 0) {
      // Find the photo that matches the cover file name
      const coverPhoto = uploadedPhotos.find(
        (photo) => photo.file_name === coverFileName
      );

      if (coverPhoto) {
        // First, unset all existing cover images for this job
        await supabase
          .from("job_photos")
          .update({ is_cover: false })
          .eq("job_id", jobId);

        // Set the new cover image
        await supabase
          .from("job_photos")
          .update({ is_cover: true })
          .eq("id", coverPhoto.id)
          .eq("job_id", jobId);
      }
    }

    return NextResponse.json(
      {
        message: "Photos uploaded successfully",
        photos: uploadedPhotos,
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photos" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/jobs/{id}/photos:
 *   get:
 *     summary: Get photos for a job
 *     description: Retrieve all photos for a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 *       404:
 *         description: Job not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get photos for this job
    const { data: photos, error } = await supabase
      .from("job_photos")
      .select("*")
      .eq("job_id", jobId)
      .order("is_cover", { ascending: false }) // Cover image first
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Get signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data } = await supabase.storage
          .from(photo.storage_bucket)
          .createSignedUrl(photo.storage_path, 3600); // 1 hour expiry

        return {
          ...photo,
          url: data?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ photos: photosWithUrls });
  } catch (error: any) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/jobs/{id}/photos:
 *   patch:
 *     summary: Set cover image for a job
 *     description: Set which photo should be the cover image for a job
 *     tags: [Jobs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoId
 *             properties:
 *               photoId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the photo to set as cover
 *     responses:
 *       200:
 *         description: Cover image updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Photo not found
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Create response object for cookie handling
    let response = NextResponse.json({});

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId } = await req.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId is required" },
        { status: 400 }
      );
    }

    // Verify photo belongs to job
    const { data: photo, error: photoError } = await supabase
      .from("job_photos")
      .select("job_id")
      .eq("id", photoId)
      .eq("job_id", jobId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    // Verify user owns the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("homeowner_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job || job.homeowner_id !== user.id) {
      return NextResponse.json(
        { error: "You can only set cover images for your own jobs" },
        { status: 403 }
      );
    }

    // Unset all existing cover images for this job
    await supabase
      .from("job_photos")
      .update({ is_cover: false })
      .eq("job_id", jobId);

    // Set the new cover image
    const { data: updatedPhoto, error: updateError } = await supabase
      .from("job_photos")
      .update({ is_cover: true })
      .eq("id", photoId)
      .eq("job_id", jobId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(
      { message: "Cover image updated", photo: updatedPhoto },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error: any) {
    console.error("Error setting cover image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to set cover image" },
      { status: 500 }
    );
  }
}

