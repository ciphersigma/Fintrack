import { useRef, useState, useEffect, useCallback } from "react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, header, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const wrapperRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    // Only start pull if we're at the very top of the scroll
    const wrapper = wrapperRef.current;
    if (!wrapper || wrapper.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!isPulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 130));
      // Prevent default scroll when pulling down
      if (diff > 10) e.preventDefault();
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPullDistance(THRESHOLD); // hold at threshold while refreshing
      try {
        await onRefresh();
      } catch { /* ignore */ }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  // Attach touch events with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const opts = { passive: false };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, opts);
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={wrapperRef} className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overscroll-none">
      {/* Stays pinned at the top — the pull indicator and content sit below it */}
      {header}

      {/* Pull indicator */}
      <div
        className="lg:hidden flex items-center justify-center shrink-0"
        style={{
          height: refreshing ? 48 : pullDistance > 5 ? pullDistance : 0,
          transition: isPulling.current ? "none" : "height 0.3s ease-out",
          overflow: "hidden",
        }}
      >
        <div
          className={`w-7 h-7 rounded-full border-[2.5px] ${
            refreshing
              ? "border-gray-200 border-t-indigo-500 animate-spin"
              : progress >= 1
              ? "border-indigo-500 border-t-transparent"
              : "border-gray-200 border-t-indigo-400"
          }`}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 540}deg)`,
            opacity: Math.max(progress * 1.5, refreshing ? 1 : 0),
          }}
        />
      </div>

      {children}
    </div>
  );
}
