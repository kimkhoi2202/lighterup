import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { getEnabledLocations } from "@/lib/location-settings";
import type { LocationSettings, LocationOptionKey } from "@/lib/location-settings";

export interface BookingFormValues {
  fullName: string;
  email: string;
  locationType: LocationOptionKey;
  inviteePhone?: string;
  address?: string;
  notes?: string;
}

interface BookingFormProps {
  locationSettings: LocationSettings;
  defaultValues?: BookingFormValues | null;
  onSubmit: (values: BookingFormValues) => void;
  onBack: () => void;
}

export function BookingForm({
  locationSettings,
  defaultValues,
  onSubmit,
  onBack,
}: BookingFormProps) {
  const enabledLocations = useMemo(() => {
    const enabled = getEnabledLocations(locationSettings);
    return enabled.length > 0 ? enabled : (["phone"] as LocationOptionKey[]);
  }, [locationSettings]);

  const schema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(1, "Your name is required"),
          email: z.string().email("Enter a valid email address"),
          locationType: z.enum(["phone", "physical"]),
          inviteePhone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (!enabledLocations.includes(data.locationType as LocationOptionKey)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["locationType"],
              message: "Please choose a location option",
            });
          }

          if (
            data.locationType === "phone" &&
            locationSettings.phone.enabled &&
            locationSettings.phone.collectInviteeNumber &&
            locationSettings.phone.requireInviteeNumber &&
            !data.inviteePhone?.trim()
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["inviteePhone"],
              message: "Phone number is required",
            });
          }

          if (
            data.locationType === "physical" &&
            locationSettings.physical.enabled &&
            locationSettings.physical.requireAddress &&
            !data.address?.trim()
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["address"],
              message: "Please provide the service address",
            });
          }
        }),
    [enabledLocations, locationSettings]
  );

  const defaultLocation =
    defaultValues?.locationType ?? enabledLocations[0] ?? ("phone" as LocationOptionKey);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      email: defaultValues?.email ?? "",
      locationType: defaultLocation,
      inviteePhone: defaultValues?.inviteePhone ?? "",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const locationTypeRegister = register("locationType");
  const selectedLocation = watch("locationType") as LocationOptionKey;
  const phoneSettings = locationSettings.phone;
  const physicalSettings = locationSettings.physical;

  const handleFormSubmit = handleSubmit((values) =>
    onSubmit({
      ...values,
      locationType: values.locationType as LocationOptionKey,
    })
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Your details</h3>
            <p className="text-sm text-zinc-500">
              We&apos;ll send confirmation and reminders to this email.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Where should we meet?</h3>
            <p className="text-sm text-zinc-500">
              Choose the option that works best for you. Additional details may be required based on your
              selection.
            </p>
          </div>
          <input type="hidden" value={selectedLocation} {...locationTypeRegister} />
          <RadioGroup
            value={selectedLocation}
            onValueChange={(value) =>
              setValue("locationType", value as LocationOptionKey, { shouldDirty: true })
            }
            className="space-y-2"
          >
            {phoneSettings.enabled && (
              <div className="flex items-start gap-3 rounded-md border border-zinc-200 p-4">
                <RadioGroupItem value="phone" id="location-phone" className="mt-1" />
                <Label htmlFor="location-phone" className="flex-1 space-y-1 cursor-pointer">
                  <span className="block text-sm font-medium text-zinc-900">Phone Call</span>
                  <span className="block text-xs text-zinc-500">
                    Connect by phone at the scheduled time.
                  </span>
                </Label>
              </div>
            )}
            {physicalSettings.enabled && (
              <div className="flex items-start gap-3 rounded-md border border-zinc-200 p-4">
                <RadioGroupItem value="physical" id="location-physical" className="mt-1" />
                <Label htmlFor="location-physical" className="flex-1 space-y-1 cursor-pointer">
                  <span className="block text-sm font-medium text-zinc-900">Physical Location</span>
                  <span className="block text-xs text-zinc-500">
                    Provide the service address and we&apos;ll come to you.
                  </span>
                </Label>
              </div>
            )}
          </RadioGroup>
          {errors.locationType && (
            <p className="text-sm text-red-600">{errors.locationType.message}</p>
          )}
        </section>

        {selectedLocation === "phone" && phoneSettings.enabled && (
          <section className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-zinc-900">Phone call details</h4>
            {phoneSettings.hostProvidesNumber && phoneSettings.hostPhoneNumber && (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                We&apos;ll call you from{" "}
                <span className="font-medium text-zinc-800">{phoneSettings.hostPhoneNumber}</span>
              </div>
            )}
            {phoneSettings.collectInviteeNumber && (
              <div className="space-y-2">
                <Label htmlFor="inviteePhone">
                  Your phone number{phoneSettings.requireInviteeNumber ? " *" : " (optional)"}
                </Label>
                <Input
                  id="inviteePhone"
                  placeholder="e.g. +1 202-555-0100"
                  {...register("inviteePhone")}
                />
                {errors.inviteePhone && (
                  <p className="text-sm text-red-600">{errors.inviteePhone.message}</p>
                )}
              </div>
            )}
          </section>
        )}

        {selectedLocation === "physical" && physicalSettings.enabled && (
          <section className="space-y-3 rounded-md border border-zinc-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-zinc-900">Service address</h4>
            <div className="space-y-2">
              <Label htmlFor="address">
                {physicalSettings.addressLabel}
                {physicalSettings.requireAddress ? " *" : ""}
              </Label>
              <Textarea
                id="address"
                placeholder="Street address, city, state"
                rows={3}
                {...register("address")}
              />
              {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
            </div>
            {physicalSettings.instructions && (
              <p className="text-xs text-zinc-500">{physicalSettings.instructions}</p>
            )}
          </section>
        )}

        <section className="space-y-2">
          <Label htmlFor="notes">Additional notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Anything else we should know before the appointment?"
            rows={4}
            {...register("notes")}
          />
        </section>
      </div>

      <div className="mt-6 flex gap-3 border-t border-zinc-100 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}

