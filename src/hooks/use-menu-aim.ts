import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

/**
 * Custom hook for implementing "menu aim" behavior (safe triangle)
 * Keeps a hover menu visible when the mouse is moving toward it
 */
export function useMenuAim() {
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<Point>({ x: 0, y: 0 });
  const prevMousePos = useRef<Point>({ x: 0, y: 0 });
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      prevMousePos.current = { ...mousePos.current };
      mousePos.current = { x: e.clientX, y: e.clientY };

      // Clear any pending timeout
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      // Check if hovering over message or menu
      const messageElement = messageRef.current;
      const menuElement = menuRef.current;

      if (!messageElement) return;

      const messageRect = messageElement.getBoundingClientRect();
      const isOverMessage =
        e.clientX >= messageRect.left &&
        e.clientX <= messageRect.right &&
        e.clientY >= messageRect.top &&
        e.clientY <= messageRect.bottom;

      let isOverMenu = false;
      if (menuElement) {
        const menuRect = menuElement.getBoundingClientRect();
        isOverMenu =
          e.clientX >= menuRect.left &&
          e.clientX <= menuRect.right &&
          e.clientY >= menuRect.top &&
          e.clientY <= menuRect.bottom;
      }

      if (isOverMessage || isOverMenu) {
        setIsHovered(true);
        return;
      }

      // Check if mouse is moving toward the menu
      if (menuElement && isHovered) {
        const menuRect = menuElement.getBoundingClientRect();
        
        // Calculate if mouse is in the safe triangle
        const isMovingTowardMenu = isPointInTriangle(
          mousePos.current,
          prevMousePos.current,
          { x: menuRect.left, y: menuRect.top },
          { x: menuRect.left, y: menuRect.bottom }
        );

        if (isMovingTowardMenu) {
          // Keep menu visible, but set a timeout in case mouse stops moving
          hoverTimeout.current = setTimeout(() => {
            setIsHovered(false);
          }, 300);
          return;
        }
      }

      // Mouse is not over message, menu, or in safe triangle
      setIsHovered(false);
    }

    function handleMouseLeave() {
      // Use a small delay before hiding
      hoverTimeout.current = setTimeout(() => {
        setIsHovered(false);
      }, 150);
    }

    if (isHovered) {
      document.addEventListener("mousemove", handleMouseMove);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        if (hoverTimeout.current) {
          clearTimeout(hoverTimeout.current);
        }
      };
    }
  }, [isHovered]);

  return {
    isHovered,
    setIsHovered,
    messageRef,
    menuRef,
  };
}

/**
 * Check if current mouse position is in a triangle formed by:
 * - Previous mouse position
 * - Top corner of target
 * - Bottom corner of target
 */
function isPointInTriangle(
  point: Point,
  prevPoint: Point,
  corner1: Point,
  corner2: Point
): boolean {
  // Simple heuristic: check if mouse is moving generally toward the menu
  // (moving up and to the right for a menu positioned above-right)
  const dx = point.x - prevPoint.x;
  const dy = point.y - prevPoint.y;
  
  // Moving toward menu (up and/or right)
  const movingUp = dy < 0;
  const movingRight = dx > 0;
  
  // If moving in the general direction of the menu, consider it in the safe zone
  return movingUp || movingRight;
}

