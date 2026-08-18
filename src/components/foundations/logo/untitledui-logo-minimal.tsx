"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

// Simple Lighter Up icon - Christmas tree emoji
export const UntitledLogoMinimal = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex size-8 items-center justify-center text-2xl", props.className)}>
            🎄
        </div>
    );
};

// Export as FestlyLogoMinimal too (legacy name, displays Lighter Up branding)
export const FestlyLogoMinimal = UntitledLogoMinimal;
