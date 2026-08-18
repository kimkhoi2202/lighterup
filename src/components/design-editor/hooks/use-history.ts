"use client";

import { fabric } from "fabric";
import { useCallback, useState, useRef, useEffect } from "react";

interface UseHistoryProps {
  canvas: fabric.Canvas | null;
  maxHistory?: number;
}

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = ({ canvas, maxHistory = 50 }: UseHistoryProps) => {
  const [historyState, setHistoryState] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
  });

  const historyRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);
  const isRestoringRef = useRef(false);

  // Save current state to history
  const saveState = useCallback(() => {
    if (!canvas || isRestoringRef.current) return;

    const json = JSON.stringify(canvas.toJSON(["name", "selectable", "evented"]));

    // Remove any future states if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(json);
    currentIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > maxHistory) {
      historyRef.current.shift();
      currentIndexRef.current--;
    }

    // Update state
    setHistoryState({
      canUndo: currentIndexRef.current > 0,
      canRedo: false,
    });
  }, [canvas, maxHistory]);

  // Restore state from history
  const restoreState = useCallback(
    (index: number) => {
      if (!canvas || index < 0 || index >= historyRef.current.length) return;

      isRestoringRef.current = true;
      const json = historyRef.current[index];

      canvas.loadFromJSON(JSON.parse(json), () => {
        canvas.renderAll();
        currentIndexRef.current = index;

        setHistoryState({
          canUndo: index > 0,
          canRedo: index < historyRef.current.length - 1,
        });

        // Small delay to allow canvas to settle
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    },
    [canvas]
  );

  // Undo action
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      restoreState(currentIndexRef.current - 1);
    }
  }, [restoreState]);

  // Redo action
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      restoreState(currentIndexRef.current + 1);
    }
  }, [restoreState]);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setHistoryState({
      canUndo: false,
      canRedo: false,
    });
  }, []);

  // Listen for canvas changes
  useEffect(() => {
    if (!canvas) return;

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
    ];

    const handleChange = () => {
      if (!isRestoringRef.current) {
        saveState();
      }
    };

    events.forEach((event) => {
      canvas.on(event, handleChange);
    });

    // Save initial state
    saveState();

    return () => {
      events.forEach((event) => {
        canvas.off(event, handleChange);
      });
    };
  }, [canvas, saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    ...historyState,
    undo,
    redo,
    saveState,
    clearHistory,
  };
};
