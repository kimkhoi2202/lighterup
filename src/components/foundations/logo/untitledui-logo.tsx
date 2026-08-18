"use client";

import type { HTMLAttributes } from "react";
import { FestlyLogo } from "./festly-logo";

// Alias for backward compatibility
export const UntitledLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return <FestlyLogo {...props} />;
};

// Export FestlyLogo as the main logo (displays "Lighter Up")
export { FestlyLogo };
