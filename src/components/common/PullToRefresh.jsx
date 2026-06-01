import React, { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(delta * 0.5, THRESHOLD + 20));
    }
  };

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center transition-all"
          style={{ height: refreshing ? THRESHOLD : pullDistance }}
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-400 transition-transform ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${progress * 360}deg)` }}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{ transform: `translateY(${refreshing ? THRESHOLD : pullDistance}px)`, transition: refreshing || pullDistance === 0 ? 'transform 0.2s' : 'none', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}