"use client";

import { fabric } from "fabric";
import { useCallback, useState, useRef, useEffect } from "react";

export interface MeasureConfig {
  unit: "ft" | "m" | "px";
  pixelsPerUnit: number; // How many pixels = 1 unit (default calibration)
  lineColor: string;
  showLabel: boolean;
}

export const DEFAULT_MEASURE_CONFIG: MeasureConfig = {
  unit: "ft",
  pixelsPerUnit: 50, // Default: 50px = 1 foot
  lineColor: "#3B82F6",
  showLabel: true,
};

interface UseMeasureProps {
  canvas: fabric.Canvas | null;
  enabled: boolean;
  config: MeasureConfig;
}

interface MeasureLine {
  id: string;
  line: fabric.Line;
  label: fabric.Text;
  group: fabric.Group;
  distance: number;
}

export const useMeasure = ({ canvas, enabled, config }: UseMeasureProps) => {
  const [measurements, setMeasurements] = useState<MeasureLine[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentLineRef = useRef<fabric.Line | null>(null);
  const currentLabelRef = useRef<fabric.Text | null>(null);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (x1: number, y1: number, x2: number, y2: number): number => {
      const pixelDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return pixelDistance / config.pixelsPerUnit;
    },
    [config.pixelsPerUnit]
  );

  // Format distance with unit
  const formatDistance = useCallback(
    (distance: number): string => {
      const formatted = distance.toFixed(1);
      return `${formatted} ${config.unit}`;
    },
    [config.unit]
  );

  // Handle drawing events
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.IEvent<Event>) => {
      if (!enabled) return;

      // If clicking on existing measurement, select it
      if (opt.target && opt.target.name === "measurement") {
        canvas.setActiveObject(opt.target);
        canvas.renderAll();
        return;
      }

      // Deselect if clicking on canvas
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        canvas.discardActiveObject();
        canvas.renderAll();
      }

      const evt = opt.e as MouseEvent;
      const pointer = canvas.getPointer(evt);

      isDrawingRef.current = true;
      startPointRef.current = { x: pointer.x, y: pointer.y };

      // Create line
      const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: config.lineColor,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });

      // Create label
      const label = new fabric.Text("0 " + config.unit, {
        left: pointer.x,
        top: pointer.y - 20,
        fontSize: 14,
        fill: config.lineColor,
        backgroundColor: "rgba(255,255,255,0.8)",
        selectable: false,
        evented: false,
      });

      currentLineRef.current = line;
      currentLabelRef.current = label;

      canvas.add(line);
      if (config.showLabel) {
        canvas.add(label);
      }
    };

    const handleMouseMove = (opt: fabric.IEvent<Event>) => {
      if (!enabled || !isDrawingRef.current || !startPointRef.current) return;

      const evt = opt.e as MouseEvent;
      const pointer = canvas.getPointer(evt);

      if (currentLineRef.current) {
        currentLineRef.current.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }

      if (currentLabelRef.current && config.showLabel) {
        const distance = calculateDistance(
          startPointRef.current.x,
          startPointRef.current.y,
          pointer.x,
          pointer.y
        );

        const midX = (startPointRef.current.x + pointer.x) / 2;
        const midY = (startPointRef.current.y + pointer.y) / 2;

        currentLabelRef.current.set({
          left: midX,
          top: midY - 20,
          text: formatDistance(distance),
        });
      }

      canvas.renderAll();
    };

    const handleMouseUp = (opt: fabric.IEvent<Event>) => {
      if (!enabled || !isDrawingRef.current || !startPointRef.current) return;

      const evt = opt.e as MouseEvent;
      const pointer = canvas.getPointer(evt);

      const distance = calculateDistance(
        startPointRef.current.x,
        startPointRef.current.y,
        pointer.x,
        pointer.y
      );

      // Only create measurement if line is long enough
      if (distance > 0.1) {
        // Remove temporary objects
        if (currentLineRef.current) canvas.remove(currentLineRef.current);
        if (currentLabelRef.current) canvas.remove(currentLabelRef.current);

        // Create final measurement line with endpoints
        const x1 = startPointRef.current.x;
        const y1 = startPointRef.current.y;
        const x2 = pointer.x;
        const y2 = pointer.y;

        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: config.lineColor,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });

        // Create endpoint circles
        const startCircle = new fabric.Circle({
          left: x1 - 4,
          top: y1 - 4,
          radius: 4,
          fill: config.lineColor,
          selectable: false,
          evented: false,
        });

        const endCircle = new fabric.Circle({
          left: x2 - 4,
          top: y2 - 4,
          radius: 4,
          fill: config.lineColor,
          selectable: false,
          evented: false,
        });

        // Create label
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const label = new fabric.Text(formatDistance(distance), {
          left: midX,
          top: midY - 20,
          fontSize: 14,
          fill: config.lineColor,
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: 4,
          selectable: false,
          evented: false,
          originX: "center",
        });

        // Group all elements
        const groupItems = config.showLabel
          ? [line, startCircle, endCircle, label]
          : [line, startCircle, endCircle];

        const group = new fabric.Group(groupItems, {
          selectable: true,
          evented: true,
          name: "measurement",
        });

        canvas.add(group);
        canvas.renderAll();

        const id = `measure-${Date.now()}`;
        const measurement: MeasureLine = {
          id,
          line,
          label,
          group,
          distance,
        };

        setMeasurements((prev) => [...prev, measurement]);
        setTotalDistance((prev) => prev + distance);
      } else {
        // Remove short measurements
        if (currentLineRef.current) canvas.remove(currentLineRef.current);
        if (currentLabelRef.current) canvas.remove(currentLabelRef.current);
      }

      isDrawingRef.current = false;
      startPointRef.current = null;
      currentLineRef.current = null;
      currentLabelRef.current = null;
    };

    if (enabled) {
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";

      canvas.on("mouse:down", handleMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);
    }

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);

      if (!enabled) {
        canvas.selection = true;
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "move";
      }
    };
  }, [canvas, enabled, config, calculateDistance, formatDistance]);

  // Delete selected measurement
  const deleteSelected = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.name === "measurement") {
      const measurement = measurements.find((m) => m.group === activeObject);
      if (measurement) {
        setTotalDistance((prev) => prev - measurement.distance);
        setMeasurements((prev) => prev.filter((m) => m !== measurement));
      }
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  }, [canvas, measurements]);

  // Clear all measurements
  const clearAll = useCallback(() => {
    if (!canvas) return;

    measurements.forEach((m) => {
      canvas.remove(m.group);
    });
    setMeasurements([]);
    setTotalDistance(0);
    canvas.renderAll();
  }, [canvas, measurements]);

  return {
    measurements,
    totalDistance,
    deleteSelected,
    clearAll,
    formatDistance,
  };
};
