"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PricingSummary } from "@/components/app/pricing-summary";
import { PhotoUploader } from "@/components/app/photo-uploader";
import { supabase } from "@/lib/supabase";
import { useCreateJobMutation } from "@/store/api/jobs-api";
import { useCalculatePricingMutation } from "@/store/api/pricing-api";

type JobFormData = {
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  numStories: number;
  houseSize: string;
  estimatedLengthFeet: number;
  complexity: "simple" | "medium" | "complex";
  requestedDateStart: string;
  lightsProvided: boolean;
  storageNeeded: boolean;
  tipAmountCents: number;
};

export default function CreateJobPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<any | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);

  // RTK Query mutations
  const [calculatePricingMutation, { isLoading: pricingLoading }] = useCalculatePricingMutation();
  const [createJob, { isLoading: loading }] = useCreateJobMutation();

  const form = useForm<JobFormData>({
    defaultValues: {
      address: "",
      city: "Austin",
      state: "TX",
      zip: "",
      description: "",
      numStories: 1,
      houseSize: "medium",
      estimatedLengthFeet: 100,
      complexity: "medium",
      requestedDateStart: "",
      lightsProvided: false,
      storageNeeded: false,
      tipAmountCents: 0,
    },
  });

  // Load user profile and region
  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          form.setValue("address", profile.home_address || "");
          form.setValue("city", profile.home_city || "Austin");
          form.setValue("state", profile.home_state || "TX");
          form.setValue("zip", profile.home_zip || "");
        }
      }

      // Get Austin region
      const { data: region } = await supabase
        .from("regions")
        .select("id")
        .eq("name", "Austin")
        .single();

      if (region) {
        setRegionId(region.id);
      }
    }

    loadData();
  }, [form]);

  // Calculate pricing when relevant fields change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const relevantFields = [
        "estimatedLengthFeet",
        "complexity",
        "lightsProvided",
        "storageNeeded",
        "tipAmountCents",
      ];

      if (relevantFields.includes(name!) && regionId) {
        calculatePricing();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, regionId]);

  async function calculatePricing() {
    if (!regionId) return;

    const values = form.getValues();
    if (!values.estimatedLengthFeet || !values.complexity) return;

    try {
      const result = await calculatePricingMutation({
        regionId,
        estimatedLengthFeet: values.estimatedLengthFeet,
        complexity: values.complexity,
        lightsProvided: values.lightsProvided,
        storageNeeded: values.storageNeeded,
        tipAmountCents: values.tipAmountCents * 100, // Convert dollars to cents
      }).unwrap();
      setPricing(result);
    } catch (err) {
      console.error("Pricing calculation failed:", err);
    }
  }

  async function onSubmit(data: JobFormData) {
    if (!regionId) {
      setError("Region not found");
      return;
    }

    setError(null);

    try {
      const { job } = await createJob({
        regionId,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        description: data.description,
        numStories: data.numStories,
        houseSize: data.houseSize,
        estimatedLengthFeet: data.estimatedLengthFeet,
        complexity: data.complexity,
        requestedDateStart: data.requestedDateStart || undefined,
        requestedDateEnd: undefined,
        lightsProvided: data.lightsProvided,
        storageNeeded: data.storageNeeded,
        tipAmountCents: data.tipAmountCents * 100, // Convert dollars to cents
      }).unwrap();

      // Upload photos if any were selected
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach((file) => {
          formData.append("files", file);
        });
        if (coverFileName) {
          formData.append("coverFileName", coverFileName);
        }

        try {
          console.log("Uploading photos:", {
            jobId: job.id,
            fileCount: uploadedFiles.length,
            coverFileName,
          });

          const photoResponse = await fetch(`/api/jobs/${job.id}/photos`, {
            method: "POST",
            body: formData,
          });
          
          const responseData = await photoResponse.json();
          
          if (!photoResponse.ok) {
            console.error("Photo upload failed:", responseData);
            // Show error to user but don't block navigation
            setError(`Job created but photo upload failed: ${responseData.error || 'Unknown error'}`);
          } else {
            console.log("Photos uploaded successfully:", responseData);
          }
        } catch (photoError: any) {
          console.error("Photo upload failed:", photoError);
          setError(`Job created but photo upload failed: ${photoError.message || 'Network error'}`);
          // Don't fail the whole job creation if photos fail
        }
      }

      // Redirect to browse contractors with the job ID attached
      router.push(`/app/homeowner/browse-contractors?jobId=${job.id}`);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Failed to create job");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create a New Job</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the details for your holiday light installation project
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <FormField
                  control={form.control}
                  name="address"
                  rules={{ required: "Address is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    rules={{ required: "City is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    rules={{ required: "State is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip"
                    rules={{
                      required: "ZIP code is required",
                      pattern: {
                        value: /^\d{5}$/,
                        message: "Please enter a valid 5-digit ZIP code",
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Job Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Job Details</h3>

                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the areas you want lights installed (roofline, trees, yard, wreaths, etc.)"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="numStories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Stories</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stories" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Story</SelectItem>
                            <SelectItem value="2">2 Stories</SelectItem>
                            <SelectItem value="3">3+ Stories</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="houseSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>House Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="estimatedLengthFeet"
                  rules={{
                    required: "Estimated length is required",
                    min: { value: 1, message: "Must be at least 1 foot" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Length of Lights (feet)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Approximate total length of light strands needed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complexity"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Project Complexity</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="simple" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Simple - Basic roofline or single area
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medium" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Medium - Multiple areas, some detail work
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="complex" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Complex - Intricate design, multiple levels
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scheduling Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scheduling</h3>
                <FormField
                  control={form.control}
                  name="requestedDateStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When would you like the installation to begin?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Options Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Options</h3>

                <FormField
                  control={form.control}
                  name="lightsProvided"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Lights Provided by Contractor</FormLabel>
                        <FormDescription>
                          Contractor will supply all light strands
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageNeeded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Storage Needed</FormLabel>
                        <FormDescription>
                          Contractor will store lights after removal
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipAmountCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optional Tip (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Add a tip to show appreciation for great work
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Reference Photos (Optional)</h3>
                <PhotoUploader
                  onPhotosChange={(files) => setUploadedFiles(files)}
                  onCoverImageChange={(fileName) => setCoverFileName(fileName)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating Job..." : "Create Job"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Pricing Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <PricingSummary pricing={pricing} loading={pricingLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
