"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Label component - uses span instead of label element to allow text selection.
 * The htmlFor prop is accepted for API compatibility but not used.
 */
function Label({
  className,
  htmlFor: _htmlFor, // Accepted but not used - allows text selection instead of input focus
  ...props
}: React.ComponentPropsWithoutRef<"span"> & { htmlFor?: string }) {
  return (
    <span
      data-slot="label"
      className={cn(
        "mb-2 block text-sm font-medium leading-none select-text cursor-text",
        className
      )}
      {...props}
    />
  )
}

export { Label }
