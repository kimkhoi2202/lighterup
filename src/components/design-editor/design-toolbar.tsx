"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Hand,
  Download,
  Trash2,
  MousePointer2,
  Undo2,
  Redo2,
} from "lucide-react";

export type ActiveTool = "select" | "pan" | "string-lights" | "decorations" | "measure";

interface DesignToolbarProps {
  editor: {
    zoom: number;
    isPanning: boolean;
    hasBackground: boolean;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    fitToScreen: () => void;
    togglePanning: () => void;
    uploadImage: (file: File) => void;
    exportImage: (format: "png" | "jpg", quality?: "standard" | "high" | "ultra") => void;
    clearCanvas: () => void;
  } | null;
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function DesignToolbar({
  editor,
  activeTool,
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: DesignToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      editor.uploadImage(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-3 border-b bg-white">
        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload a home photo</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor?.zoomOut()}
                disabled={!editor}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {editor ? `${Math.round(editor.zoom * 100)}%` : "100%"}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor?.zoomIn()}
                disabled={!editor}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor?.fitToScreen()}
              disabled={!editor || !editor.hasBackground}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to Screen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor?.resetZoom()}
              disabled={!editor}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Pan Tool */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editor?.isPanning ? "secondary" : "ghost"}
              size="icon"
              onClick={() => editor?.togglePanning()}
              disabled={!editor}
            >
              <Hand className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pan Mode (drag to move)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={!editor?.isPanning ? "secondary" : "ghost"}
              size="icon"
              onClick={() => {
                if (editor?.isPanning) {
                  editor.togglePanning();
                }
              }}
              disabled={!editor}
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Select Mode</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {/* Export & Clear */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor?.clearCanvas()}
              disabled={!editor}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Canvas</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => editor?.exportImage("png", "high")}
              disabled={!editor}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as high-quality PNG</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
