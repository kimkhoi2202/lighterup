"use client";

import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Image as ImageIcon, Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

interface PhotoUploaderProps {
  onPhotosChange?: (files: File[]) => void;
  onCoverImageChange?: (fileName: string | null) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes, default 5MB
  initialCoverId?: string | null;
}

export function PhotoUploader({
  onPhotosChange,
  onCoverImageChange,
  maxFiles = 20,
  maxSize = 5 * 1024 * 1024, // 5MB default
  initialCoverId = null,
}: PhotoUploaderProps) {
  const [coverImageId, setCoverImageId] = useState<string | null>(initialCoverId || null);

  const [state, actions] = useFileUpload({
    maxFiles,
    maxSize,
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    onFilesChange: (files) => {
      // Convert FileWithPreview[] to File[] for the callback
      const fileArray = files
        .map((f) => f.file)
        .filter((f): f is File => f instanceof File);
      onPhotosChange?.(fileArray);

      // If cover image was removed, clear it
      if (coverImageId && !files.find((f) => f.id === coverImageId)) {
        setCoverImageId(null);
        onCoverImageChange?.(null);
      }
    },
  });

  const handleRemove = useCallback(
    (id: string) => {
      // If removing the cover image, clear it
      if (coverImageId === id) {
        setCoverImageId(null);
        onCoverImageChange?.(null);
      }
      actions.removeFile(id);
    },
    [actions, coverImageId, onCoverImageChange]
  );

  const handleSetCover = useCallback(
    (id: string) => {
      setCoverImageId(id);
      // Find the file name for the cover image
      const coverFile = state.files.find((f) => f.id === id);
      if (coverFile && coverFile.file instanceof File) {
        onCoverImageChange?.(coverFile.file.name);
      } else if (coverFile && 'name' in coverFile.file) {
        onCoverImageChange?.(coverFile.file.name);
      } else {
        onCoverImageChange?.(null);
      }
    },
    [onCoverImageChange, state.files]
  );

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={actions.handleDragEnter}
        onDragLeave={actions.handleDragLeave}
        onDragOver={actions.handleDragOver}
        onDrop={actions.handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${
            state.isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }
        `}
      >
        <input
          {...actions.getInputProps({
            className: "hidden",
            id: "photo-upload",
          })}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">
              {state.isDragging ? "Drop images here" : "Upload reference photos"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop images here, or{" "}
              <button
                type="button"
                onClick={actions.openFileDialog}
                className="text-primary hover:underline font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP up to {formatBytes(maxSize)} • Max {maxFiles} files
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={actions.openFileDialog}
            className="mt-2"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {state.errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 space-y-1">
          {state.errors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Gallery Preview */}
      {state.files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {state.files.length} {state.files.length === 1 ? "photo" : "photos"} selected
            </p>
            {state.files.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={actions.clearFiles}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {state.files.map((fileWithPreview) => {
              const isCover = coverImageId === fileWithPreview.id;
              return (
                <div
                  key={fileWithPreview.id}
                  className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-muted/50 ${
                    isCover ? "border-primary ring-2 ring-primary" : "border-muted"
                  }`}
                >
                  {fileWithPreview.preview ? (
                    <Image
                      src={fileWithPreview.preview}
                      alt={fileWithPreview.file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Cover badge */}
                  {isCover && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Cover
                      </Badge>
                    </div>
                  )}

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!isCover && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetCover(fileWithPreview.id)}
                        className="h-8 px-3"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Cover
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(fileWithPreview.id)}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate" title={fileWithPreview.file.name}>
                      {fileWithPreview.file.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / k ** i).toFixed(dm)) + " " + sizes[i];
}
