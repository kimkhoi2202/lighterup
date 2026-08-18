"use client";

import { DesignEditor } from "@/components/design-editor/design-editor";

export default function DesignHomePage() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Design Home</h1>
        <p className="text-muted-foreground">
          Upload a photo of your home and design lighting decorations
        </p>
      </div>
      <div className="flex-1 rounded-lg border bg-white overflow-hidden">
        <DesignEditor />
      </div>
    </div>
  );
}
