"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

export const FestlyLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex h-8 items-center justify-start", props.className)}>
            <span className="text-2xl font-bold text-primary">
                🎄 Lighter Up
            </span>
        </div>
    );
};

