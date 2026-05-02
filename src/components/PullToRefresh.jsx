import { useRef, useState, useCallback } from "react";

const PULL_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Apply resistance — pull gets harder the further you go
      const distance = Math.min(diff * 0.4, 120);
      setPullDistance(distance);
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch {
        // ignore
      }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || refreshing;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto lg:overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="lg:hidden flex items-center justify-center overflow-hidden transition-all"
        style={{
          height: showIndicator ? `${refreshing ? 48 : pullDistance}px` : 0,
          transition: pulling.current ? "none" : "height 0.25s ease-out",
        }}
      >
        <div
          className={`w-6 h-6 border-2 rounded-full ${
            refreshing
              ? "border-gray-300 border-t-indigo-500 animate-spin"
              : progress >= 1
              ? "border-indigo-500"
              : "border-gray-200 border-t-indigo-400"
          }`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
            opacity: Math.max(progress, refreshing ? 1 : 0),
            transition: pulling.current ? "none" : "all 0.2s ease",
          }}
        />
      </div>

      {children}
    </div>
  );
}
