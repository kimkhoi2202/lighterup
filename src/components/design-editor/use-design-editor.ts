"use client";

import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";

interface UseDesignEditorProps {
  onSave?: (json: string) => void;
}

interface EditorState {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
  zoom: number;
  isPanning: boolean;
}

export const useDesignEditor = ({ onSave }: UseDesignEditorProps = {}) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<fabric.Image | null>(null);

  const lastPosRef = useRef({ x: 0, y: 0 });

  // Auto-resize canvas when container changes
  useEffect(() => {
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvas, container]);

  // Handle panning
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (opt: fabric.IEvent<Event>) => {
      if (!isPanning) return;

      const evt = opt.e as MouseEvent;
      canvas.selection = false;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.setCursor("grabbing");
    };

    const handleMouseMove = (opt: fabric.IEvent<Event>) => {
      const evt = opt.e as MouseEvent;
      if (!isPanning || !evt.buttons) return;

      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      vpt[4] += evt.clientX - lastPosRef.current.x;
      vpt[5] += evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: evt.clientX, y: evt.clientY };
      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (!isPanning) return;
      canvas.selection = true;
      canvas.setCursor("grab");
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [canvas, isPanning]);

  // Handle mouse wheel zoom
  useEffect(() => {
    if (!canvas) return;

    const handleWheel = (opt: fabric.IEvent<Event>) => {
      const evt = opt.e as WheelEvent;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let newZoom = canvas.getZoom() * (1 - delta / 500);

      // Limit zoom
      newZoom = Math.min(Math.max(newZoom, 0.1), 5);

      const point = new fabric.Point(evt.offsetX, evt.offsetY);
      canvas.zoomToPoint(point, newZoom);
      setZoom(newZoom);
    };

    canvas.on("mouse:wheel", handleWheel);

    return () => {
      canvas.off("mouse:wheel", handleWheel);
    };
  }, [canvas]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      // Configure object controls
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#EA2831",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#EA2831",
      });

      // Set canvas size
      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      // Set background color
      initialCanvas.backgroundColor = "#f5f5f5";
      initialCanvas.renderAll();

      setCanvas(initialCanvas);
      setContainer(initialContainer);
    },
    []
  );

  const zoomIn = useCallback(() => {
    if (!canvas) return;

    let newZoom = canvas.getZoom() * 1.1;
    newZoom = Math.min(newZoom, 5);

    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  }, [canvas]);

  const zoomOut = useCallback(() => {
    if (!canvas) return;

    let newZoom = canvas.getZoom() * 0.9;
    newZoom = Math.max(newZoom, 0.1);

    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    setZoom(newZoom);
  }, [canvas]);

  const resetZoom = useCallback(() => {
    if (!canvas) return;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
    canvas.renderAll();
  }, [canvas]);

  const fitToScreen = useCallback(() => {
    if (!canvas || !container || !backgroundImage) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const imgWidth = backgroundImage.width || 1;
    const imgHeight = backgroundImage.height || 1;

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const center = canvas.getCenter();
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), scale);
    setZoom(scale);

    // Center the image
    const vpt = canvas.viewportTransform;
    if (vpt) {
      vpt[4] = (containerWidth - imgWidth * scale) / 2;
      vpt[5] = (containerHeight - imgHeight * scale) / 2;
      canvas.setViewportTransform(vpt);
    }

    canvas.renderAll();
  }, [canvas, container, backgroundImage]);

  const togglePanning = useCallback(() => {
    setIsPanning((prev) => {
      if (canvas) {
        canvas.setCursor(prev ? "default" : "grab");
        canvas.selection = prev;
      }
      return !prev;
    });
  }, [canvas]);

  const uploadImage = useCallback((file: File) => {
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      fabric.Image.fromURL(dataUrl, (img) => {
        // Remove previous background if exists
        if (backgroundImage) {
          canvas.remove(backgroundImage);
        }

        // Scale image to fit canvas while maintaining aspect ratio
        const containerWidth = container?.offsetWidth || canvas.getWidth();
        const containerHeight = container?.offsetHeight || canvas.getHeight();

        const imgWidth = img.width || 1;
        const imgHeight = img.height || 1;

        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (containerWidth - imgWidth * scale) / 2,
          top: (containerHeight - imgHeight * scale) / 2,
          selectable: false,
          evented: false,
          name: "background",
        });

        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();

        setBackgroundImage(img);
      });
    };

    reader.readAsDataURL(file);
  }, [canvas, container, backgroundImage]);

  const exportImage = useCallback((format: "png" | "jpg" = "png", quality: "standard" | "high" | "ultra" = "high") => {
    if (!canvas) return;

    // Quality multipliers for different export qualities
    const multipliers = {
      standard: 1,
      high: 2,
      ultra: 4,
    };

    const dataUrl = canvas.toDataURL({
      format,
      quality: 1,
      multiplier: multipliers[quality],
    });

    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `design-${timestamp}-${quality}.${format}`;
    link.href = dataUrl;
    link.click();
  }, [canvas]);

  // Export with custom dimensions
  const exportImageWithDimensions = useCallback((
    format: "png" | "jpg" = "png",
    width: number,
    height: number
  ) => {
    if (!canvas) return;

    const currentWidth = canvas.getWidth();
    const currentHeight = canvas.getHeight();

    const scaleX = width / currentWidth;
    const scaleY = height / currentHeight;
    const multiplier = Math.max(scaleX, scaleY);

    const dataUrl = canvas.toDataURL({
      format,
      quality: 1,
      multiplier,
    });

    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `design-${timestamp}-${width}x${height}.${format}`;
    link.href = dataUrl;
    link.click();
  }, [canvas]);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = "#f5f5f5";
    canvas.renderAll();
    setBackgroundImage(null);
  }, [canvas]);

  const editor = useMemo(() => {
    if (!canvas) return null;

    return {
      canvas,
      zoom,
      isPanning,
      hasBackground: !!backgroundImage,
      zoomIn,
      zoomOut,
      resetZoom,
      fitToScreen,
      togglePanning,
      uploadImage,
      exportImage,
      exportImageWithDimensions,
      clearCanvas,
    };
  }, [
    canvas,
    zoom,
    isPanning,
    backgroundImage,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    togglePanning,
    uploadImage,
    exportImage,
    exportImageWithDimensions,
    clearCanvas,
  ]);

  return { init, editor };
};
