"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Lightbulb, Plus, Minus, Copy } from "lucide-react";
import {
  StringLightConfig,
  ColorPattern,
  DEFAULT_STRING_LIGHT_CONFIG,
} from "./hooks/use-string-lights";

interface StringLightsSidebarProps {
  isOpen: boolean;
  config: StringLightConfig;
  onConfigChange: (config: StringLightConfig) => void;
  onClose: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onDuplicate: () => void;
}

const PRESET_COLORS = [
  { name: "Warm White", color: "#FFD700" },
  { name: "Cool White", color: "#F5F5F5" },
  { name: "Red", color: "#FF0000" },
  { name: "Green", color: "#00FF00" },
  { name: "Blue", color: "#0066FF" },
  { name: "Orange", color: "#FF6600" },
  { name: "Purple", color: "#9933FF" },
  { name: "Pink", color: "#FF69B4" },
];

const COLOR_PATTERNS: { value: ColorPattern; label: string; description: string }[] = [
  { value: "solid", label: "Solid", description: "Single color" },
  { value: "alternating", label: "Alternating", description: "Colors repeat in sequence" },
  { value: "gradient", label: "Gradient", description: "Smooth color transition" },
  { value: "random", label: "Random", description: "Random color mix" },
];

// Helper functions for preview
function interpolateColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function getPreviewColor(index: number, total: number, config: StringLightConfig): string {
  if (config.colorPattern === "solid" || config.lightColors.length === 0) {
    return config.lightColor;
  }
  const colors = config.lightColors.length > 0 ? config.lightColors : [config.lightColor];
  switch (config.colorPattern) {
    case "alternating":
      return colors[index % colors.length];
    case "gradient":
      if (colors.length === 1) return colors[0];
      const progress = index / Math.max(total - 1, 1);
      const colorIndex = progress * (colors.length - 1);
      const startIdx = Math.floor(colorIndex);
      const endIdx = Math.min(startIdx + 1, colors.length - 1);
      const t = colorIndex - startIdx;
      return interpolateColor(colors[startIdx], colors[endIdx], t);
    case "random":
      return colors[Math.floor(seededRandom(index) * colors.length)];
    default:
      return config.lightColor;
  }
}

export function StringLightsSidebar({
  isOpen,
  config,
  onConfigChange,
  onClose,
  onDeleteSelected,
  onClearAll,
  onDuplicate,
}: StringLightsSidebarProps) {
  if (!isOpen) return null;

  const updateConfig = (updates: Partial<StringLightConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="absolute right-0 top-0 h-full w-[300px] bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">String Lights</h3>
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
            Click and drag on the canvas to draw string lights along rooflines
            or edges.
          </div>

          {/* Color Pattern */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Color Pattern</Label>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_PATTERNS.map((pattern) => (
                <button
                  key={pattern.value}
                  className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${
                    config.colorPattern === pattern.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateConfig({ colorPattern: pattern.value })}
                >
                  <div className="text-sm font-medium">{pattern.label}</div>
                  <div className="text-xs text-muted-foreground">{pattern.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Light Colors (Multi-color) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Light Colors {config.colorPattern !== "solid" && `(${config.lightColors.length}/5)`}
              </Label>
              {config.colorPattern !== "solid" && config.lightColors.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    const newColors = [...config.lightColors, PRESET_COLORS[config.lightColors.length % PRESET_COLORS.length].color];
                    updateConfig({ lightColors: newColors });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {config.colorPattern === "solid" ? (
              <>
                {/* Single color selection */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.color}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        config.lightColor === preset.color
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      onClick={() => updateConfig({ lightColor: preset.color, lightColors: [preset.color] })}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Custom:</Label>
                  <input
                    type="color"
                    value={config.lightColor}
                    onChange={(e) => updateConfig({ lightColor: e.target.value, lightColors: [e.target.value] })}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <span className="text-xs text-muted-foreground">
                    {config.lightColor}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Multi-color selection */}
                <div className="space-y-2">
                  {config.lightColors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...config.lightColors];
                          newColors[index] = e.target.value;
                          updateConfig({ lightColors: newColors });
                        }}
                        className="w-10 h-8 rounded cursor-pointer border"
                      />
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        {PRESET_COLORS.slice(0, 4).map((preset) => (
                          <button
                            key={preset.color}
                            className={`w-full aspect-square rounded border transition-all ${
                              color === preset.color
                                ? "border-primary"
                                : "border-transparent hover:border-gray-300"
                            }`}
                            style={{ backgroundColor: preset.color }}
                            onClick={() => {
                              const newColors = [...config.lightColors];
                              newColors[index] = preset.color;
                              updateConfig({ lightColors: newColors });
                            }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                      {config.lightColors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            const newColors = config.lightColors.filter((_, i) => i !== index);
                            updateConfig({ lightColors: newColors });
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Bulb Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Bulb Size</Label>
              <span className="text-sm text-muted-foreground">
                {config.bulbSize}px
              </span>
            </div>
            <Slider
              value={[config.bulbSize]}
              onValueChange={([value]) => updateConfig({ bulbSize: value })}
              min={6}
              max={20}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <Separator />

          {/* Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Bulb Spacing</Label>
              <span className="text-sm text-muted-foreground">
                {config.spacing}px
              </span>
            </div>
            <Slider
              value={[config.spacing]}
              onValueChange={([value]) => updateConfig({ spacing: value })}
              min={15}
              max={60}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dense</span>
              <span>Sparse</span>
            </div>
          </div>

          <Separator />

          {/* Wire Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Wire Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.wireColor}
                onChange={(e) => updateConfig({ wireColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border"
              />
              <span className="text-sm text-muted-foreground">
                {config.wireColor}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Wire Width</Label>
              <span className="text-sm text-muted-foreground">
                {config.wireWidth}px
              </span>
            </div>
            <Slider
              value={[config.wireWidth]}
              onValueChange={([value]) => updateConfig({ wireWidth: value })}
              min={1}
              max={5}
              step={1}
            />
          </div>

          <Separator />

          {/* Glow Effect */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Glow Effect</Label>
            <button
              onClick={() => updateConfig({ glowEnabled: !config.glowEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.glowEnabled ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.glowEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center min-h-[60px]">
              <div className="flex items-center gap-1">
                {[...Array(8)].map((_, i) => {
                  const previewColor = getPreviewColor(i, 8, config);
                  return (
                    <div key={i} className="flex items-center">
                      {i > 0 && (
                        <div
                          className="h-[2px] w-3"
                          style={{
                            backgroundColor: config.wireColor,
                            height: config.wireWidth,
                          }}
                        />
                      )}
                      <div
                        className="rounded-full"
                        style={{
                          width: config.bulbSize,
                          height: config.bulbSize,
                          backgroundColor: previewColor,
                          boxShadow: config.glowEnabled
                            ? `0 0 ${config.bulbSize}px ${previewColor}`
                            : "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
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
          Clear All Lights
        </Button>
      </div>
    </div>
  );
}
