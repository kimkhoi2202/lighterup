"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Ruler } from "lucide-react";
import { MeasureConfig } from "./hooks/use-measure";

interface MeasureSidebarProps {
  isOpen: boolean;
  config: MeasureConfig;
  onConfigChange: (config: MeasureConfig) => void;
  onClose: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  totalDistance: number;
  measurementCount: number;
  formatDistance: (distance: number) => string;
}

const UNIT_OPTIONS: { value: MeasureConfig["unit"]; label: string }[] = [
  { value: "ft", label: "Feet (ft)" },
  { value: "m", label: "Meters (m)" },
  { value: "px", label: "Pixels (px)" },
];

const LINE_COLORS = [
  { name: "Blue", color: "#3B82F6" },
  { name: "Red", color: "#EF4444" },
  { name: "Green", color: "#22C55E" },
  { name: "Orange", color: "#F97316" },
  { name: "Purple", color: "#A855F7" },
  { name: "Yellow", color: "#EAB308" },
];

export function MeasureSidebar({
  isOpen,
  config,
  onConfigChange,
  onClose,
  onDeleteSelected,
  onClearAll,
  totalDistance,
  measurementCount,
  formatDistance,
}: MeasureSidebarProps) {
  if (!isOpen) return null;

  const updateConfig = (updates: Partial<MeasureConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[300px] bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Measure</h3>
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
            Click and drag on the canvas to measure distances. Use calibration
            to set the scale based on a known measurement.
          </div>

          {/* Total Measurements */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">
              Total Distance ({measurementCount} measurements)
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatDistance(totalDistance)}
            </div>
          </div>

          <Separator />

          {/* Unit Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Unit</Label>
            <div className="grid grid-cols-3 gap-2">
              {UNIT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                    config.unit === option.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateConfig({ unit: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Calibration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Calibration (px per {config.unit})
              </Label>
              <span className="text-sm text-muted-foreground">
                {config.pixelsPerUnit}
              </span>
            </div>
            <Slider
              value={[config.pixelsPerUnit]}
              onValueChange={([value]) => updateConfig({ pixelsPerUnit: value })}
              min={10}
              max={200}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Adjust this to match the actual scale of your image. Draw a line
              over a known distance and adjust until it matches.
            </p>
          </div>

          <Separator />

          {/* Line Color */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Line Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {LINE_COLORS.map((preset) => (
                <button
                  key={preset.color}
                  className={`w-full aspect-square rounded-lg border-2 transition-all ${
                    config.lineColor === preset.color
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.color }}
                  onClick={() => updateConfig({ lineColor: preset.color })}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Show Label Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Show Distance Labels</Label>
            <button
              onClick={() => updateConfig({ showLabel: !config.showLabel })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.showLabel ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.showLabel ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
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
          Clear All Measurements
        </Button>
      </div>
    </div>
  );
}
