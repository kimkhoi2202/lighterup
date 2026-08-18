"use client";

import { fabric } from "fabric";
import { useCallback, useState, useRef, useEffect } from "react";

// Helper: Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

// Helper: Get bounding box of polygon
function getPolygonBounds(polygon: { x: number; y: number }[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

// Helper: Generate random points inside a polygon
function generateRandomPointsInPolygon(
  polygon: { x: number; y: number }[],
  spacing: number,
  seed: number = 12345
): { x: number; y: number }[] {
  const bounds = getPolygonBounds(polygon);
  const points: { x: number; y: number }[] = [];

  // Calculate approximate area and number of points based on spacing
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const area = width * height;
  const pointDensity = 1 / (spacing * spacing * 0.5); // Adjust density based on spacing
  const targetPoints = Math.floor(area * pointDensity);

  // Use seeded random for consistency
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  // Generate random points using rejection sampling
  let attempts = 0;
  const maxAttempts = targetPoints * 10;

  while (points.length < targetPoints && attempts < maxAttempts) {
    const x = bounds.minX + random() * width;
    const y = bounds.minY + random() * height;

    if (isPointInPolygon({ x, y }, polygon)) {
      // Check minimum distance from existing points
      let tooClose = false;
      const minDistance = spacing * 0.6; // Minimum distance between bulbs

      for (const existing of points) {
        const dx = x - existing.x;
        const dy = y - existing.y;
        if (dx * dx + dy * dy < minDistance * minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        points.push({ x, y });
      }
    }
    attempts++;
  }

  return points;
}

// Helper: Check if polygon is closed (first and last points are close)
function isPolygonClosed(
  points: { x: number; y: number }[],
  threshold: number = 30
): boolean {
  if (points.length < 3) return false;

  const first = points[0];
  const last = points[points.length - 1];
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= threshold;
}

// Helper: Interpolate between two hex colors
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

// Helper: Seeded random for consistent "random" patterns
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export type ColorPattern = "solid" | "alternating" | "gradient" | "random";

export interface StringLightConfig {
  lightColor: string;
  lightColors: string[]; // Multi-color support (up to 5 colors)
  colorPattern: ColorPattern;
  bulbSize: number;
  spacing: number;
  wireColor: string;
  wireWidth: number;
  glowEnabled: boolean;
}

export const DEFAULT_STRING_LIGHT_CONFIG: StringLightConfig = {
  lightColor: "#FFD700", // Warm yellow (legacy, for solid color)
  lightColors: ["#FFD700"], // Multi-color array
  colorPattern: "solid",
  bulbSize: 10,
  spacing: 30,
  wireColor: "#2d2d2d",
  wireWidth: 2,
  glowEnabled: true,
};

interface UseStringLightsProps {
  canvas: fabric.Canvas | null;
  enabled: boolean;
  config: StringLightConfig;
}

interface StringLightGroup {
  id: string;
  group: fabric.Group;
  wire: fabric.Path;
  bulbs: fabric.Circle[];
}

export const useStringLights = ({
  canvas,
  enabled,
  config,
}: UseStringLightsProps) => {
  const [stringLights, setStringLights] = useState<StringLightGroup[]>([]);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<fabric.Path | null>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isShiftHeldRef = useRef(false);

  // Get points along a path
  const getPointsAlongPath = useCallback(
    (pathData: string, spacing: number): { x: number; y: number }[] => {
      // Create temporary SVG path to get total length
      const svgNS = "http://www.w3.org/2000/svg";
      const tempPath = document.createElementNS(svgNS, "path");
      tempPath.setAttribute("d", pathData);

      const pathLength = tempPath.getTotalLength();
      const points: { x: number; y: number }[] = [];
      const numPoints = Math.floor(pathLength / spacing);

      for (let i = 0; i <= numPoints; i++) {
        const point = tempPath.getPointAtLength(i * spacing);
        points.push({ x: point.x, y: point.y });
      }

      return points;
    },
    []
  );

  // Get color for bulb based on pattern and index
  const getBulbColor = useCallback(
    (index: number, totalBulbs: number): string => {
      const { colorPattern, lightColor, lightColors } = config;

      if (colorPattern === "solid" || lightColors.length === 0) {
        return lightColor;
      }

      const colors = lightColors.length > 0 ? lightColors : [lightColor];

      switch (colorPattern) {
        case "alternating":
          return colors[index % colors.length];

        case "gradient":
          // Interpolate between colors
          if (colors.length === 1) return colors[0];
          const progress = index / Math.max(totalBulbs - 1, 1);
          const colorIndex = progress * (colors.length - 1);
          const startIdx = Math.floor(colorIndex);
          const endIdx = Math.min(startIdx + 1, colors.length - 1);
          const t = colorIndex - startIdx;
          return interpolateColor(colors[startIdx], colors[endIdx], t);

        case "random":
          // Use seeded random based on index for consistency
          return colors[Math.floor(seededRandom(index) * colors.length)];

        default:
          return lightColor;
      }
    },
    [config]
  );

  // Create bulb at position
  const createBulb = useCallback(
    (x: number, y: number, color: string, size: number, glow: boolean) => {
      const bulb = new fabric.Circle({
        left: x - size / 2,
        top: y - size / 2,
        radius: size / 2,
        fill: color,
        stroke: "#333",
        strokeWidth: 1,
        selectable: false,
        evented: false,
        originX: "center",
        originY: "center",
      });

      if (glow) {
        bulb.set({
          shadow: new fabric.Shadow({
            color: color,
            blur: size * 1.5,
            offsetX: 0,
            offsetY: 0,
          }),
        });
      }

      return bulb;
    },
    []
  );

  // Create string light from path
  const createStringLightFromPath = useCallback(
    (path: fabric.Path, drawnPoints: { x: number; y: number }[]) => {
      if (!canvas) return null;

      // Get path data
      const pathData = path.path;
      if (!pathData) return null;

      // Convert path array to SVG path string
      let svgPathString = "";
      pathData.forEach((segment: any) => {
        if (segment[0] === "M") {
          svgPathString += `M ${segment[1]} ${segment[2]} `;
        } else if (segment[0] === "Q") {
          svgPathString += `Q ${segment[1]} ${segment[2]} ${segment[3]} ${segment[4]} `;
        } else if (segment[0] === "L") {
          svgPathString += `L ${segment[1]} ${segment[2]} `;
        }
      });

      if (!svgPathString) return null;

      // Check if polygon is closed
      const isClosed = isPolygonClosed(drawnPoints, 30);

      let bulbPoints: { x: number; y: number }[];
      let finalPathString = svgPathString;

      if (isClosed && drawnPoints.length >= 3) {
        // Closed polygon: fill with random points inside
        // Close the path visually
        finalPathString = svgPathString + " Z";

        // Generate random points inside the polygon
        bulbPoints = generateRandomPointsInPolygon(
          drawnPoints,
          config.spacing,
          Date.now()
        );

        // If no points generated (polygon too small), fall back to path points
        if (bulbPoints.length === 0) {
          bulbPoints = getPointsAlongPath(svgPathString, config.spacing);
        }
      } else {
        // Open path: bulbs along the line
        bulbPoints = getPointsAlongPath(svgPathString, config.spacing);
      }

      if (bulbPoints.length < 2) return null;

      // Create wire (the drawn path styled as wire)
      const wire = new fabric.Path(finalPathString, {
        fill: "transparent",
        stroke: config.wireColor,
        strokeWidth: config.wireWidth,
        selectable: false,
        evented: false,
      });

      // Create bulbs at each point with multi-color support
      const bulbs = bulbPoints.map((point, index) => {
        const color = getBulbColor(index, bulbPoints.length);
        return createBulb(
          point.x,
          point.y,
          color,
          config.bulbSize,
          config.glowEnabled
        );
      });

      // Group wire and bulbs together
      const groupObjects = [wire, ...bulbs];
      const group = new fabric.Group(groupObjects, {
        selectable: true,
        evented: true,
        name: "string-light",
      });

      const id = `sl-${Date.now()}`;

      return {
        id,
        group,
        wire,
        bulbs,
      };
    },
    [canvas, config, getPointsAlongPath, createBulb, getBulbColor]
  );

  // Handle drawing events
  useEffect(() => {
    if (!canvas) return;

    // Track Shift key state
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftHeldRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        isShiftHeldRef.current = false;
      }
    };

    const handleMouseDown = (opt: fabric.IEvent<Event>) => {
      if (!enabled) return;

      // If clicking on an existing string light, select it and don't draw
      if (opt.target && opt.target.name === "string-light") {
        canvas.setActiveObject(opt.target);
        canvas.renderAll();
        return;
      }

      // If there's already a selected object, deselect it first and don't draw
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      const evt = opt.e as MouseEvent;
      const pointer = canvas.getPointer(evt);

      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };
      pointsRef.current = [{ x: pointer.x, y: pointer.y }];

      // Create initial path
      const path = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        fill: "transparent",
        stroke: config.wireColor,
        strokeWidth: config.wireWidth,
        selectable: false,
        evented: false,
      });

      currentPathRef.current = path;
      canvas.add(path);
    };

    const handleMouseMove = (opt: fabric.IEvent<Event>) => {
      if (!enabled || !isDrawingRef.current || !currentPathRef.current || !startPointRef.current) return;

      const evt = opt.e as MouseEvent;
      const pointer = canvas.getPointer(evt);

      let pathData: string;

      // Check if Shift is held for straight line mode
      if (isShiftHeldRef.current) {
        // Straight line mode: only use start point and current point
        pathData = `M ${startPointRef.current.x} ${startPointRef.current.y} L ${pointer.x} ${pointer.y}`;

        // Update points to just start and end for final creation
        pointsRef.current = [
          startPointRef.current,
          { x: pointer.x, y: pointer.y }
        ];
      } else {
        // Freehand mode: add point to path
        pointsRef.current.push({ x: pointer.x, y: pointer.y });

        // Build a smooth continuous path using line segments
        // This ensures no gaps between segments
        pathData = `M ${pointsRef.current[0].x} ${pointsRef.current[0].y}`;

        for (let i = 1; i < pointsRef.current.length; i++) {
          const curr = pointsRef.current[i];
          pathData += ` L ${curr.x} ${curr.y}`;
        }
      }

      // Remove old path and create new one to properly update bounding box
      canvas.remove(currentPathRef.current);

      const newPath = new fabric.Path(pathData, {
        fill: "transparent",
        stroke: config.wireColor,
        strokeWidth: config.wireWidth,
        selectable: false,
        evented: false,
      });

      currentPathRef.current = newPath;
      canvas.add(newPath);
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!enabled || !isDrawingRef.current || !currentPathRef.current) return;

      isDrawingRef.current = false;

      // For straight line mode, we only need 2 points (start and end)
      // For freehand mode, we need more than 5 points
      const minPoints = isShiftHeldRef.current ? 2 : 6;

      // Only create string light if path has enough points
      if (pointsRef.current.length >= minPoints) {
        // Remove the drawing path
        canvas.remove(currentPathRef.current);

        // Create string light group (pass drawn points for closed polygon detection)
        const stringLight = createStringLightFromPath(
          currentPathRef.current,
          [...pointsRef.current]
        );

        if (stringLight) {
          canvas.add(stringLight.group);
          setStringLights((prev) => [...prev, stringLight]);
        }
      } else {
        // Remove short paths
        canvas.remove(currentPathRef.current);
      }

      currentPathRef.current = null;
      pointsRef.current = [];
      startPointRef.current = null;
      canvas.renderAll();
    };

    if (enabled) {
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";

      canvas.on("mouse:down", handleMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);

      // Add keyboard listeners for Shift key
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (!enabled) {
        canvas.selection = true;
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "move";
      }
    };
  }, [canvas, enabled, config, createStringLightFromPath]);

  // Delete selected string light
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "string-light") {
      canvas.remove(activeObject);
      setStringLights((prev) =>
        prev.filter((sl) => sl.group !== activeObject)
      );
      canvas.renderAll();
    }
  }, [canvas]);

  // Clear all string lights
  const clearAll = useCallback(() => {
    if (!canvas) return;

    stringLights.forEach((sl) => {
      canvas.remove(sl.group);
    });
    setStringLights([]);
    canvas.renderAll();
  }, [canvas, stringLights]);

  // Duplicate selected string light
  const duplicateSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "string-light") {
      // Clone the group
      activeObject.clone((cloned: fabric.Group) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
          name: "string-light",
        });

        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();

        // Add to state
        const id = `sl-${Date.now()}`;
        setStringLights((prev) => [
          ...prev,
          {
            id,
            group: cloned,
            wire: cloned.getObjects()[0] as fabric.Path,
            bulbs: cloned.getObjects().slice(1) as fabric.Circle[],
          },
        ]);
      });
    }
  }, [canvas]);

  // Get selected string light info
  const getSelectedInfo = useCallback(() => {
    if (!canvas) return null;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "string-light") {
      const group = activeObject as fabric.Group;
      const objects = group.getObjects();
      const bulbCount = objects.length - 1; // minus the wire
      return {
        bulbCount,
        group,
      };
    }
    return null;
  }, [canvas]);

  return {
    stringLights,
    deleteSelected,
    clearAll,
    duplicateSelected,
    getSelectedInfo,
  };
};
