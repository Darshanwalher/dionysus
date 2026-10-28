import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Atmosphere({
  className,
  spotlight = false,
  intensity = "subtle",
}) {
  const wrapRef = useRef(null);
  const [spot, setSpot] = useState({ x: "50%", y: "20%" });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!spotlight || reduced) return;
    const onMove = (event) => {
      const node = wrapRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setSpot({ x: `${x}%`, y: `${y}%` });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [spotlight, reduced]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "atmosphere pointer-events-none fixed inset-0 overflow-hidden",
        intensity === "subtle" ? "opacity-30" : "opacity-50",
        className
      )}
      aria-hidden="true"
    >
      <div className="atmosphere-grid" />
      <div className="atmosphere-orb atmosphere-orb--subtle" />
      {spotlight && !reduced && (
        <div
          className="spotlight"
          style={{ "--spot-x": spot.x, "--spot-y": spot.y }}
        />
      )}
    </div>
  );
}
