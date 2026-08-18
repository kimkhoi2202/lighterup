export type LocationOptionKey = "phone" | "physical";

export interface PhoneLocationSettings {
  enabled: boolean;
  hostProvidesNumber: boolean;
  hostPhoneNumber: string;
  collectInviteeNumber: boolean;
  requireInviteeNumber: boolean;
}

export interface PhysicalLocationSettings {
  enabled: boolean;
  requireAddress: boolean;
  addressLabel: string;
  instructions: string;
}

export interface LocationSettings {
  phone: PhoneLocationSettings;
  physical: PhysicalLocationSettings;
}

export function getDefaultLocationSettings(): LocationSettings {
  return {
    phone: {
      enabled: true,
      hostProvidesNumber: false,
      hostPhoneNumber: "",
      collectInviteeNumber: true,
      requireInviteeNumber: true,
    },
    physical: {
      enabled: true,
      requireAddress: true,
      addressLabel: "Service address",
      instructions: "",
    },
  };
}

export function normalizeLocationSettings(raw: unknown): LocationSettings {
  const defaults = getDefaultLocationSettings();

  // Legacy array of strings
  if (Array.isArray(raw)) {
    return {
      phone: {
        ...defaults.phone,
        enabled: raw.includes("phone"),
      },
      physical: {
        ...defaults.physical,
        enabled: raw.includes("on_site") || raw.includes("physical"),
      },
    };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, any>;
    const phoneRaw = obj.phone ?? obj.phone_call ?? {};
    const physicalRaw = obj.physical ?? obj.on_site ?? {};

    return {
      phone: {
        ...defaults.phone,
        ...(typeof phoneRaw === "object" ? phoneRaw : {}),
        enabled:
          typeof phoneRaw?.enabled === "boolean"
            ? phoneRaw.enabled
            : obj.phone?.enabled ?? obj.phone_enabled ?? defaults.phone.enabled,
        hostPhoneNumber:
          typeof phoneRaw?.hostPhoneNumber === "string"
            ? phoneRaw.hostPhoneNumber
            : "",
      },
      physical: {
        ...defaults.physical,
        ...(typeof physicalRaw === "object" ? physicalRaw : {}),
        enabled:
          typeof physicalRaw?.enabled === "boolean"
            ? physicalRaw.enabled
            : obj.physical?.enabled ??
              obj.on_site?.enabled ??
              defaults.physical.enabled,
        addressLabel:
          typeof physicalRaw?.addressLabel === "string" && physicalRaw.addressLabel.trim().length > 0
            ? physicalRaw.addressLabel
            : defaults.physical.addressLabel,
        instructions:
          typeof physicalRaw?.instructions === "string"
            ? physicalRaw.instructions
            : defaults.physical.instructions,
      },
    };
  }

  return defaults;
}

export function getEnabledLocations(settings: LocationSettings): LocationOptionKey[] {
  const locations: LocationOptionKey[] = [];
  if (settings.phone.enabled) {
    locations.push("phone");
  }
  if (settings.physical.enabled) {
    locations.push("physical");
  }
  return locations;
}

