"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  TreePine,
  Ruler,
  Trash2,
  Copy,
  Plus,
  Minus,
  Settings,
} from "lucide-react";
import {
  StringLightConfig,
  ColorPattern,
} from "./hooks/use-string-lights";
import {
  DecorationConfig,
  DecorationType,
} from "./hooks/use-decorations";
import { MeasureConfig } from "./hooks/use-measure";

// ============ TYPES ============
interface ToolsSidebarProps {
  // String lights
  stringLightConfig: StringLightConfig;
  onStringLightConfigChange: (config: StringLightConfig) => void;
  onDeleteStringLight: () => void;
  onClearAllStringLights: () => void;
  onDuplicateStringLight: () => void;

  // Decorations
  decorationConfig: DecorationConfig;
  onDecorationConfigChange: (config: DecorationConfig) => void;
  onAddDecoration: () => void;
  onDeleteDecoration: () => void;
  onClearAllDecorations: () => void;
  onDuplicateDecoration: () => void;

  // Measure
  measureConfig: MeasureConfig;
  onMeasureConfigChange: (config: MeasureConfig) => void;
  onDeleteMeasurement: () => void;
  onClearAllMeasurements: () => void;
  totalDistance: number;
  measurementCount: number;
  formatDistance: (distance: number) => string;

  // Active tool
  activeTool: string;
  onToolChange: (tool: string) => void;
}

// ============ CONSTANTS ============
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

const COLOR_PATTERNS: { value: ColorPattern; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "alternating", label: "Alternating" },
  { value: "gradient", label: "Gradient" },
  { value: "random", label: "Random" },
];

const DECORATION_TYPES: { type: DecorationType; label: string; icon: string }[] = [
  { type: "wreath", label: "Wreath", icon: "⭕" },
  { type: "bow", label: "Bow", icon: "🎀" },
  { type: "garland", label: "Garland", icon: "〰️" },
  { type: "star", label: "Star", icon: "⭐" },
  { type: "snowflake", label: "Snowflake", icon: "❄️" },
  { type: "candy-cane", label: "Candy Cane", icon: "🍬" },
];

// ============ HELPER FUNCTIONS ============
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

// ============ MAIN COMPONENT ============
export function ToolsSidebar({
  stringLightConfig,
  onStringLightConfigChange,
  onDeleteStringLight,
  onClearAllStringLights,
  onDuplicateStringLight,
  decorationConfig,
  onDecorationConfigChange,
  onAddDecoration,
  onDeleteDecoration,
  onClearAllDecorations,
  onDuplicateDecoration,
  measureConfig,
  onMeasureConfigChange,
  onDeleteMeasurement,
  onClearAllMeasurements,
  totalDistance,
  measurementCount,
  formatDistance,
  activeTool,
  onToolChange,
}: ToolsSidebarProps) {
  const updateStringLightConfig = (updates: Partial<StringLightConfig>) => {
    onStringLightConfigChange({ ...stringLightConfig, ...updates });
  };

  const updateDecorationConfig = (updates: Partial<DecorationConfig>) => {
    onDecorationConfigChange({ ...decorationConfig, ...updates });
  };

  const updateMeasureConfig = (updates: Partial<MeasureConfig>) => {
    onMeasureConfigChange({ ...measureConfig, ...updates });
  };

  return (
    <div className="w-[320px] bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Design Tools
        </h2>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTool}
        onValueChange={onToolChange}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid grid-cols-3 mx-4 mt-4 shrink-0">
          <TabsTrigger value="string-lights" className="gap-1.5">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Lights</span>
          </TabsTrigger>
          <TabsTrigger value="decorations" className="gap-1.5">
            <TreePine className="h-4 w-4" />
            <span className="hidden sm:inline">Decor</span>
          </TabsTrigger>
          <TabsTrigger value="measure" className="gap-1.5">
            <Ruler className="h-4 w-4" />
            <span className="hidden sm:inline">Measure</span>
          </TabsTrigger>
        </TabsList>

        {/* String Lights Tab */}
        <TabsContent value="string-lights" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-5">
              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Click and drag on the image to draw string lights
              </div>

              {/* Preview */}
              <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                <div className="flex items-center">
                  {[...Array(6)].map((_, i) => {
                    const previewColor = getPreviewColor(i, 6, stringLightConfig);
                    return (
                      <div key={i} className="flex items-center">
                        {i > 0 && (
                          <div
                            className="w-3"
                            style={{
                              backgroundColor: stringLightConfig.wireColor,
                              height: stringLightConfig.wireWidth,
                            }}
                          />
                        )}
                        <div
                          className="rounded-full"
                          style={{
                            width: stringLightConfig.bulbSize,
                            height: stringLightConfig.bulbSize,
                            backgroundColor: previewColor,
                            boxShadow: stringLightConfig.glowEnabled
                              ? `0 0 ${stringLightConfig.bulbSize}px ${previewColor}`
                              : "none",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Color Pattern */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pattern</Label>
                <div className="grid grid-cols-4 gap-1">
                  {COLOR_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.value}
                      className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                        stringLightConfig.colorPattern === pattern.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      onClick={() => updateStringLightConfig({ colorPattern: pattern.value })}
                    >
                      {pattern.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Colors</Label>
                  {stringLightConfig.colorPattern !== "solid" && stringLightConfig.lightColors.length < 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        const newColors = [...stringLightConfig.lightColors, PRESET_COLORS[stringLightConfig.lightColors.length % PRESET_COLORS.length].color];
                        updateStringLightConfig({ lightColors: newColors });
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>

                {stringLightConfig.colorPattern === "solid" ? (
                  <div className="grid grid-cols-8 gap-1">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.color}
                        className={`aspect-square rounded-md border-2 transition-all ${
                          stringLightConfig.lightColor === preset.color
                            ? "border-primary scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: preset.color }}
                        onClick={() => updateStringLightConfig({ lightColor: preset.color, lightColors: [preset.color] })}
                        title={preset.name}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {stringLightConfig.lightColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...stringLightConfig.lightColors];
                            newColors[index] = e.target.value;
                            updateStringLightConfig({ lightColors: newColors });
                          }}
                          className="w-8 h-8 rounded cursor-pointer border-0"
                        />
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {PRESET_COLORS.slice(0, 4).map((preset) => (
                            <button
                              key={preset.color}
                              className={`aspect-square rounded border transition-all ${
                                color === preset.color ? "border-primary" : "border-transparent"
                              }`}
                              style={{ backgroundColor: preset.color }}
                              onClick={() => {
                                const newColors = [...stringLightConfig.lightColors];
                                newColors[index] = preset.color;
                                updateStringLightConfig({ lightColors: newColors });
                              }}
                            />
                          ))}
                        </div>
                        {stringLightConfig.lightColors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              const newColors = stringLightConfig.lightColors.filter((_, i) => i !== index);
                              updateStringLightConfig({ lightColors: newColors });
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Bulb Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Bulb Size</Label>
                  <span className="text-xs text-muted-foreground">{stringLightConfig.bulbSize}px</span>
                </div>
                <Slider
                  value={[stringLightConfig.bulbSize]}
                  onValueChange={([value]) => updateStringLightConfig({ bulbSize: value })}
                  min={6}
                  max={20}
                  step={1}
                />
              </div>

              {/* Spacing */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Spacing</Label>
                  <span className="text-xs text-muted-foreground">{stringLightConfig.spacing}px</span>
                </div>
                <Slider
                  value={[stringLightConfig.spacing]}
                  onValueChange={([value]) => updateStringLightConfig({ spacing: value })}
                  min={15}
                  max={60}
                  step={5}
                />
              </div>

              {/* Glow */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Glow Effect</Label>
                <button
                  onClick={() => updateStringLightConfig({ glowEnabled: !stringLightConfig.glowEnabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    stringLightConfig.glowEnabled ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      stringLightConfig.glowEnabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onDuplicateStringLight}>
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={onDeleteStringLight}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Button variant="destructive" size="sm" className="w-full" onClick={onClearAllStringLights}>
              Clear All Lights
            </Button>
          </div>
        </TabsContent>

        {/* Decorations Tab */}
        <TabsContent value="decorations" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-5">
              {/* Instructions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                Select a decoration and click Add to place it
              </div>

              {/* Decoration Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DECORATION_TYPES.map((decoration) => (
                    <button
                      key={decoration.type}
                      className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                        decorationConfig.type === decoration.type
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => updateDecorationConfig({ type: decoration.type })}
                    >
                      <span className="text-xl">{decoration.icon}</span>
                      <span className="text-xs">{decoration.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Size</Label>
                  <span className="text-xs text-muted-foreground">{decorationConfig.size}px</span>
                </div>
                <Slider
                  value={[decorationConfig.size]}
                  onValueChange={([value]) => updateDecorationConfig({ size: value })}
                  min={30}
                  max={200}
                  step={10}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color</Label>
                <div className="grid grid-cols-8 gap-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.color}
                      className={`aspect-square rounded-md border-2 transition-all ${
                        decorationConfig.color === preset.color
                          ? "border-primary scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      onClick={() => updateDecorationConfig({ color: preset.color })}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Rotation</Label>
                  <span className="text-xs text-muted-foreground">{decorationConfig.rotation}°</span>
                </div>
                <Slider
                  value={[decorationConfig.rotation]}
                  onValueChange={([value]) => updateDecorationConfig({ rotation: value })}
                  min={0}
                  max={360}
                  step={15}
                />
              </div>

              {/* Add Button */}
              <Button className="w-full" onClick={onAddDecoration}>
                <Plus className="h-4 w-4 mr-2" />
                Add {DECORATION_TYPES.find(d => d.type === decorationConfig.type)?.label}
              </Button>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onDuplicateDecoration}>
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button variant="outline" size="sm" onClick={onDeleteDecoration}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <Button variant="destructive" size="sm" className="w-full" onClick={onClearAllDecorations}>
              Clear All Decorations
            </Button>
          </div>
        </TabsContent>

        {/* Measure Tab */}
        <TabsContent value="measure" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 h-full">
            <div className="p-4 space-y-5">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Click and drag to measure distances
              </div>

              {/* Total */}
              <div className="bg-blue-100 rounded-lg p-4 text-center">
                <div className="text-sm text-blue-600 mb-1">
                  Total ({measurementCount} lines)
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatDistance(totalDistance)}
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unit</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ft", "m", "px"] as const).map((unit) => (
                    <button
                      key={unit}
                      className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                        measureConfig.unit === unit
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => updateMeasureConfig({ unit })}
                    >
                      {unit === "ft" ? "Feet" : unit === "m" ? "Meters" : "Pixels"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calibration */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Scale (px/{measureConfig.unit})</Label>
                  <span className="text-xs text-muted-foreground">{measureConfig.pixelsPerUnit}</span>
                </div>
                <Slider
                  value={[measureConfig.pixelsPerUnit]}
                  onValueChange={([value]) => updateMeasureConfig({ pixelsPerUnit: value })}
                  min={10}
                  max={200}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Adjust to match your image scale
                </p>
              </div>

              {/* Show Labels */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Show Labels</Label>
                <button
                  onClick={() => updateMeasureConfig({ showLabel: !measureConfig.showLabel })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    measureConfig.showLabel ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      measureConfig.showLabel ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={onDeleteMeasurement}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={onClearAllMeasurements}>
              Clear All Measurements
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
