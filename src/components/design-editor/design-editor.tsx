"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDesignEditor } from "./use-design-editor";
import { DesignToolbar } from "./design-toolbar";
import { ToolsSidebar } from "./tools-sidebar";
import {
  useStringLights,
  StringLightConfig,
  DEFAULT_STRING_LIGHT_CONFIG,
} from "./hooks/use-string-lights";
import {
  useDecorations,
  DecorationConfig,
  DEFAULT_DECORATION_CONFIG,
} from "./hooks/use-decorations";
import {
  useMeasure,
  MeasureConfig,
  DEFAULT_MEASURE_CONFIG,
} from "./hooks/use-measure";
import { useHistory } from "./hooks/use-history";

type ToolType = "string-lights" | "decorations" | "measure";

export function DesignEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<ToolType>("string-lights");
  const [stringLightConfig, setStringLightConfig] = useState<StringLightConfig>(
    DEFAULT_STRING_LIGHT_CONFIG
  );
  const [decorationConfig, setDecorationConfig] = useState<DecorationConfig>(
    DEFAULT_DECORATION_CONFIG
  );
  const [measureConfig, setMeasureConfig] = useState<MeasureConfig>(
    DEFAULT_MEASURE_CONFIG
  );

  const { init, editor } = useDesignEditor();

  // String lights hook
  const {
    deleteSelected: deleteStringLight,
    clearAll: clearAllStringLights,
    duplicateSelected: duplicateStringLight,
  } = useStringLights({
    canvas: editor?.canvas || null,
    enabled: activeTool === "string-lights",
    config: stringLightConfig,
  });

  // Decorations hook
  const {
    addDecorationAtCenter,
    deleteSelected: deleteDecoration,
    clearAll: clearAllDecorations,
    duplicateSelected: duplicateDecoration,
  } = useDecorations({
    canvas: editor?.canvas || null,
    enabled: activeTool === "decorations",
    config: decorationConfig,
  });

  // Measure hook
  const {
    measurements,
    totalDistance,
    deleteSelected: deleteMeasurement,
    clearAll: clearAllMeasurements,
    formatDistance,
  } = useMeasure({
    canvas: editor?.canvas || null,
    enabled: activeTool === "measure",
    config: measureConfig,
  });

  // History hook (undo/redo)
  const { canUndo, canRedo, undo, redo } = useHistory({
    canvas: editor?.canvas || null,
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Delete key - try to delete any selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        // Try all delete functions - they will only delete if their object type is selected
        deleteStringLight();
        deleteDecoration();
        deleteMeasurement();
      }

      // Ctrl/Cmd + D = Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (activeTool === "string-lights") {
          duplicateStringLight();
        } else if (activeTool === "decorations") {
          duplicateDecoration();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTool,
    deleteStringLight,
    deleteDecoration,
    deleteMeasurement,
    duplicateStringLight,
    duplicateDecoration,
  ]);

  // Handle tool change from sidebar
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool as ToolType);
  }, []);

  // Get tool indicator
  const getToolIndicator = () => {
    switch (activeTool) {
      case "string-lights":
        return { text: "Click and drag to draw lights (hold Shift for straight line)", color: "bg-yellow-500" };
      case "decorations":
        return { text: "Select decoration and click Add", color: "bg-green-600" };
      case "measure":
        return { text: "Click and drag to measure", color: "bg-blue-600" };
      default:
        return null;
    }
  };

  const toolIndicator = getToolIndicator();

  return (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <DesignToolbar
        editor={editor}
        activeTool="select"
        onToolChange={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <ToolsSidebar
          // String lights
          stringLightConfig={stringLightConfig}
          onStringLightConfigChange={setStringLightConfig}
          onDeleteStringLight={deleteStringLight}
          onClearAllStringLights={clearAllStringLights}
          onDuplicateStringLight={duplicateStringLight}
          // Decorations
          decorationConfig={decorationConfig}
          onDecorationConfigChange={setDecorationConfig}
          onAddDecoration={addDecorationAtCenter}
          onDeleteDecoration={deleteDecoration}
          onClearAllDecorations={clearAllDecorations}
          onDuplicateDecoration={duplicateDecoration}
          // Measure
          measureConfig={measureConfig}
          onMeasureConfigChange={setMeasureConfig}
          onDeleteMeasurement={deleteMeasurement}
          onClearAllMeasurements={clearAllMeasurements}
          totalDistance={totalDistance}
          measurementCount={measurements.length}
          formatDistance={formatDistance}
          // Active tool
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-100">
          <div ref={containerRef} className="h-full w-full">
            <canvas ref={canvasRef} />
          </div>

          {/* Zoom indicator */}
          {editor && (
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-1.5 text-sm text-muted-foreground">
              {Math.round(editor.zoom * 100)}%
            </div>
          )}

          {/* Tool indicator */}
          {toolIndicator && (
            <div
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${toolIndicator.color} text-white rounded-lg shadow-md px-4 py-2 text-sm font-medium`}
            >
              {toolIndicator.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
