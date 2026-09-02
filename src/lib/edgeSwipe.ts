import { useEffect, useRef } from "react";

const EDGE_ZONE_PX = 30;
const MIN_SWIPE_DISTANCE_PX = 40;
const MAX_VERTICAL_DEVIATION_PX = 80;

export function useLeftEdgeSwipe(onSwipe: () => void) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;

      if (touch.clientX <= EDGE_ZONE_PX) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    }

    function handleTouchMove(event: TouchEvent) {
      const start = touchStartRef.current;
      if (!start) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      if (
        deltaX >= MIN_SWIPE_DISTANCE_PX &&
        deltaY <= MAX_VERTICAL_DEVIATION_PX
      ) {
        event.preventDefault();
        touchStartRef.current = null;
        onSwipeRef.current();
      }
    }

    function handleTouchEnd() {
      touchStartRef.current = null;
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);
}
