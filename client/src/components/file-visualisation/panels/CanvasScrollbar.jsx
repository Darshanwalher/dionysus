import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

/**
 * Visual Interactive Vertical Scrollbar for React Flow Canvas
 * - Synchronizes with React Flow viewport
 * - Click or drag to scroll vertically
 * - Rolling wheel directly over the scrollbar track scrolls vertically
 */
export default function CanvasScrollbar({ nodes = [] }) {
  const { getViewport, setViewport } = useReactFlow();
  const trackRef = useRef(null);
  const [thumbState, setThumbState] = useState({ top: 0, height: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartViewportY = useRef(0);

  // Compute the total vertical span of the diagram
  const getBounds = useCallback(() => {
    if (!nodes || nodes.length === 0) return { minY: 0, maxY: 1000, height: 1000 };
    let minY = Infinity;
    let maxY = -Infinity;
    nodes.forEach((n) => {
      const y = n.position?.y ?? 0;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y + (n.data?.height || 160);
    });
    if (minY === Infinity) minY = 0;
    if (maxY === -Infinity) maxY = 1000;
    const padding = 200;
    return {
      minY: minY - padding,
      maxY: maxY + padding,
      height: Math.max(800, maxY - minY + padding * 2),
    };
  }, [nodes]);

  // Update thumb position based on current React Flow viewport
  const updateThumb = useCallback(() => {
    if (!trackRef.current) return;
    const trackHeight = trackRef.current.clientHeight;
    if (trackHeight <= 0) return;

    const viewport = getViewport();
    const bounds = getBounds();
    const windowHeight = trackHeight;

    const virtualTotalHeight = bounds.height * viewport.zoom;
    const thumbRatio = Math.min(1, Math.max(0.12, windowHeight / virtualTotalHeight));
    const thumbHeight = Math.max(32, trackHeight * thumbRatio);

    const currentY = -viewport.y;
    const scrollableRange = virtualTotalHeight - windowHeight;
    const scrollProgress = scrollableRange > 0
      ? Math.max(0, Math.min(1, (currentY - bounds.minY * viewport.zoom) / scrollableRange))
      : 0;

    const thumbTop = scrollProgress * (trackHeight - thumbHeight);

    setThumbState({
      top: isNaN(thumbTop) ? 0 : thumbTop,
      height: isNaN(thumbHeight) ? 40 : thumbHeight,
    });
  }, [getViewport, getBounds]);

  useEffect(() => {
    updateThumb();
    const interval = setInterval(updateThumb, 120);
    return () => clearInterval(interval);
  }, [updateThumb]);

  // Handle clicking on the track to jump/scroll
  const handleTrackClick = (e) => {
    if (!trackRef.current || isDragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackHeight = rect.height;
    const progress = Math.max(0, Math.min(1, clickY / trackHeight));

    const viewport = getViewport();
    const bounds = getBounds();
    const virtualTotalHeight = bounds.height * viewport.zoom;
    const targetY = -(bounds.minY * viewport.zoom + progress * (virtualTotalHeight - trackHeight));

    setViewport({ x: viewport.x, y: targetY, zoom: viewport.zoom }, { duration: 250 });
  };

  // Start dragging thumb
  const handleThumbMouseDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartViewportY.current = getViewport().y;
  };

  // Dragging movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !trackRef.current) return;
      const trackHeight = trackRef.current.clientHeight;
      const deltaY = e.clientY - dragStartY.current;

      const viewport = getViewport();
      const bounds = getBounds();
      const virtualTotalHeight = bounds.height * viewport.zoom;
      const scrollableRange = virtualTotalHeight - trackHeight;
      const progressDelta = (deltaY / (trackHeight - thumbState.height)) * scrollableRange;

      setViewport({
        x: viewport.x,
        y: dragStartViewportY.current - progressDelta,
        zoom: viewport.zoom,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, getViewport, setViewport, getBounds, thumbState.height]);

  // Rolling mouse wheel directly over the scrollbar track scrolls vertically
  const handleTrackWheel = (e) => {
    e.stopPropagation();
    const viewport = getViewport();
    setViewport({
      x: viewport.x,
      y: viewport.y - e.deltaY * 1.5,
      zoom: viewport.zoom,
    });
  };

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      onWheel={handleTrackWheel}
      className="absolute right-0 top-0 bottom-0 w-3 bg-card/40 hover:bg-card/80 border-l border-border/40 backdrop-blur-xs z-20 cursor-pointer select-none transition-colors group"
      title="Drag or click to scroll diagram"
    >
      {/* Scrollbar Thumb */}
      <div
        onMouseDown={handleThumbMouseDown}
        style={{
          transform: `translateY(${thumbState.top}px)`,
          height: `${thumbState.height}px`,
        }}
        className={`w-full rounded-full px-0.5 transition-colors cursor-grab active:cursor-grabbing ${
          isDragging
            ? "bg-foreground/50"
            : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
        }`}
      >
        <div className="w-full h-full rounded-full bg-current" />
      </div>
    </div>
  );
}
