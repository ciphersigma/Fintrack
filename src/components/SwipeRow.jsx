import { useRef, useState, useCallback } from "react";

const THRESHOLD = 60;

export default function SwipeRow({ onSwipeLeft, onSwipeRight, children }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const [offset, setOffset] = useState(0);
  const swiping = useRef(false);
  const locked = useRef(false); // true = horizontal swipe, false = vertical scroll

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
    locked.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swiping.current) return;

    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Decide direction on first significant move
    if (!locked.current) {
      if (Math.abs(dy) > Math.abs(dx) + 5) {
        // Vertical scroll — bail out
        swiping.current = false;
        setOffset(0);
        return;
      }
      if (Math.abs(dx) > 10) {
        locked.current = true;
      }
      return;
    }

    // Horizontal swipe with rubber-band resistance
    const clamped = Math.sign(dx) * Math.min(Math.abs(dx) * 0.5, 100);
    setOffset(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (offset < -THRESHOLD && onSwipeLeft) onSwipeLeft();
    else if (offset > THRESHOLD && onSwipeRight) onSwipeRight();
    swiping.current = false;
    locked.current = false;
    setOffset(0);
  }, [offset, onSwipeLeft, onSwipeRight]);

  const showLeft = offset > 20;
  const showRight = offset < -20;

  return (
    <div className="relative overflow-hidden sm:overflow-visible">
      {/* Reveal layers — only visible during swipe on mobile */}
      {(showLeft || showRight) && (
        <div className="absolute inset-0 flex sm:hidden pointer-events-none">
          <div className={`flex items-center pl-4 w-1/2 transition-colors duration-150 ${offset > THRESHOLD ? "bg-indigo-500" : "bg-indigo-50"}`}>
            <span className={`text-xs font-bold ${offset > THRESHOLD ? "text-white" : "text-indigo-400"}`}>✏️ Edit</span>
          </div>
          <div className={`flex items-center justify-end pr-4 w-1/2 transition-colors duration-150 ${offset < -THRESHOLD ? "bg-rose-500" : "bg-rose-50"}`}>
            <span className={`text-xs font-bold ${offset < -THRESHOLD ? "text-white" : "text-rose-400"}`}>🗑 Delete</span>
          </div>
        </div>
      )}

      <div
        className="relative bg-white"
        style={{
          transform: offset !== 0 ? `translateX(${offset}px)` : undefined,
          transition: swiping.current ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
