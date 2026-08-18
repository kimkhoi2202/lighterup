"use client";

import { fabric } from "fabric";
import { useCallback, useState } from "react";

export type DecorationType = "wreath" | "bow" | "garland" | "star" | "snowflake" | "candy-cane";

export interface DecorationConfig {
  type: DecorationType;
  size: number;
  color: string;
  rotation: number;
}

export const DEFAULT_DECORATION_CONFIG: DecorationConfig = {
  type: "wreath",
  size: 80,
  color: "#228B22", // Forest green
  rotation: 0,
};

interface UseDecorationsProps {
  canvas: fabric.Canvas | null;
  enabled: boolean;
  config: DecorationConfig;
}

// SVG paths for decorations
const DECORATION_PATHS: Record<DecorationType, { path: string; viewBox: string }> = {
  wreath: {
    path: "M50 10 C70 10 90 30 90 50 C90 70 70 90 50 90 C30 90 10 70 10 50 C10 30 30 10 50 10 M50 20 C35 20 20 35 20 50 C20 65 35 80 50 80 C65 80 80 65 80 50 C80 35 65 20 50 20",
    viewBox: "0 0 100 100",
  },
  bow: {
    path: "M50 50 Q30 30 10 50 Q30 70 50 50 Q70 30 90 50 Q70 70 50 50 M50 50 L50 80 M45 65 L55 65 M43 75 L57 75",
    viewBox: "0 0 100 100",
  },
  garland: {
    path: "M10 50 Q25 30 40 50 Q55 70 70 50 Q85 30 100 50 M10 50 Q25 70 40 50 Q55 30 70 50 Q85 70 100 50",
    viewBox: "0 0 110 100",
  },
  star: {
    path: "M50 5 L61 40 L98 40 L68 62 L79 97 L50 75 L21 97 L32 62 L2 40 L39 40 Z",
    viewBox: "0 0 100 100",
  },
  snowflake: {
    path: "M50 10 L50 90 M10 50 L90 50 M22 22 L78 78 M78 22 L22 78 M50 10 L45 20 M50 10 L55 20 M50 90 L45 80 M50 90 L55 80 M10 50 L20 45 M10 50 L20 55 M90 50 L80 45 M90 50 L80 55",
    viewBox: "0 0 100 100",
  },
  "candy-cane": {
    path: "M30 90 L30 40 Q30 10 60 10 Q90 10 90 40 M30 90 L40 90 L40 45 Q40 20 60 20 Q80 20 80 40",
    viewBox: "0 0 100 100",
  },
};

const DECORATION_LABELS: Record<DecorationType, string> = {
  wreath: "Wreath",
  bow: "Bow",
  garland: "Garland",
  star: "Star",
  snowflake: "Snowflake",
  "candy-cane": "Candy Cane",
};

export const useDecorations = ({ canvas, enabled, config }: UseDecorationsProps) => {
  const [decorations, setDecorations] = useState<fabric.Object[]>([]);

  // Add decoration at position
  const addDecoration = useCallback(
    (x: number, y: number) => {
      if (!canvas) return;

      const { type, size, color, rotation } = config;
      const decorationData = DECORATION_PATHS[type];

      // Create SVG path
      const path = new fabric.Path(decorationData.path, {
        left: x - size / 2,
        top: y - size / 2,
        fill: type === "bow" || type === "star" ? color : "transparent",
        stroke: color,
        strokeWidth: type === "garland" ? 4 : 2,
        scaleX: size / 100,
        scaleY: size / 100,
        angle: rotation,
        selectable: true,
        evented: true,
        name: "decoration",
        originX: "center",
        originY: "center",
      });

      // Add glow effect for star and snowflake
      if (type === "star" || type === "snowflake") {
        path.set({
          shadow: new fabric.Shadow({
            color: color,
            blur: 10,
            offsetX: 0,
            offsetY: 0,
          }),
        });
      }

      canvas.add(path);
      canvas.setActiveObject(path);
      canvas.renderAll();

      setDecorations((prev) => [...prev, path]);
    },
    [canvas, config]
  );

  // Add decoration from drag
  const addDecorationAtCenter = useCallback(() => {
    if (!canvas) return;

    const center = canvas.getCenter();
    addDecoration(center.left, center.top);
  }, [canvas, addDecoration]);

  // Delete selected decoration
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "decoration") {
      canvas.remove(activeObject);
      setDecorations((prev) => prev.filter((d) => d !== activeObject));
      canvas.renderAll();
    }
  }, [canvas]);

  // Clear all decorations
  const clearAll = useCallback(() => {
    if (!canvas) return;

    decorations.forEach((d) => {
      canvas.remove(d);
    });
    setDecorations([]);
    canvas.renderAll();
  }, [canvas, decorations]);

  // Duplicate selected
  const duplicateSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "decoration") {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
          name: "decoration",
        });

        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();

        setDecorations((prev) => [...prev, cloned]);
      });
    }
  }, [canvas]);

  return {
    decorations,
    addDecoration,
    addDecorationAtCenter,
    deleteSelected,
    clearAll,
    duplicateSelected,
    decorationTypes: Object.keys(DECORATION_PATHS) as DecorationType[],
    decorationLabels: DECORATION_LABELS,
  };
};
