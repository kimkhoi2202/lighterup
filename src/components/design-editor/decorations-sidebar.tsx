"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, TreePine, Plus, Copy } from "lucide-react";
import {
  DecorationConfig,
  DecorationType,
} from "./hooks/use-decorations";

interface DecorationsSidebarProps {
  isOpen: boolean;
  config: DecorationConfig;
  onConfigChange: (config: DecorationConfig) => void;
  onClose: () => void;
  onAddDecoration: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onDuplicate: () => void;
}

const PRESET_COLORS = [
  { name: "Forest Green", color: "#228B22" },
  { name: "Red", color: "#DC143C" },
  { name: "Gold", color: "#FFD700" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "White", color: "#FFFFFF" },
  { name: "Blue", color: "#1E90FF" },
  { name: "Purple", color: "#9370DB" },
  { name: "Pink", color: "#FF69B4" },
];

const DECORATION_TYPES: { type: DecorationType; label: string; icon: string }[] = [
  { type: "wreath", label: "Wreath", icon: "⭕" },
  { type: "bow", label: "Bow", icon: "🎀" },
  { type: "garland", label: "Garland", icon: "〰️" },
  { type: "star", label: "Star", icon: "⭐" },
  { type: "snowflake", label: "Snowflake", icon: "❄️" },
  { type: "candy-cane", label: "Candy Cane", icon: "🍬" },
];

export function DecorationsSidebar({
  isOpen,
  config,
  onConfigChange,
  onClose,
  onAddDecoration,
  onDeleteSelected,
  onClearAll,
  onDuplicate,
}: DecorationsSidebarProps) {
  if (!isOpen) return null;

  const updateConfig = (updates: Partial<DecorationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[300px] bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Decorations</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            Select a decoration type and click "Add" to place it on the canvas.
            You can then drag to position it.
          </div>

          {/* Decoration Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Decoration Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {DECORATION_TYPES.map((decoration) => (
                <button
                  key={decoration.type}
                  className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                    config.type === decoration.type
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateConfig({ type: decoration.type })}
                >
                  <span className="text-2xl">{decoration.icon}</span>
                  <span className="text-xs">{decoration.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Size</Label>
              <span className="text-sm text-muted-foreground">
                {config.size}px
              </span>
            </div>
            <Slider
              value={[config.size]}
              onValueChange={([value]) => updateConfig({ size: value })}
              min={30}
              max={200}
              step={10}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <Separator />

          {/* Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.color}
                  className={`w-full aspect-square rounded-lg border-2 transition-all ${
                    config.color === preset.color
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => updateConfig({ color: preset.color })}
                  title={preset.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Custom:</Label>
              <input
                type="color"
                value={config.color}
                onChange={(e) => updateConfig({ color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border"
              />
              <span className="text-xs text-muted-foreground">
                {config.color}
              </span>
            </div>
          </div>

          <Separator />

          {/* Rotation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rotation</Label>
              <span className="text-sm text-muted-foreground">
                {config.rotation}°
              </span>
            </div>
            <Slider
              value={[config.rotation]}
              onValueChange={([value]) => updateConfig({ rotation: value })}
              min={0}
              max={360}
              step={15}
            />
          </div>

          <Separator />

          {/* Add Button */}
          <Button
            className="w-full gap-2"
            onClick={onAddDecoration}
          >
            <Plus className="h-4 w-4" />
            Add {DECORATION_TYPES.find(d => d.type === config.type)?.label}
          </Button>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={onDuplicate}
        >
          <Copy className="h-4 w-4" />
          Duplicate Selected
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-4 w-4" />
          Delete Selected
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          onClick={onClearAll}
        >
          <Trash2 className="h-4 w-4" />
          Clear All Decorations
        </Button>
      </div>
    </div>
  );
}
