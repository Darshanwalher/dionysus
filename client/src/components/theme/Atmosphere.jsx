import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Atmosphere({
  className,
  spotlight = false,
  intensity = "full",
}) {
  const wrapRef = useRef(null);
  const [spot, setSpot] = useState({ x: "50%", y: "30%" });
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
      className={cn("atmosphere", intensity === "subtle" && "opacity-40", className)}
      aria-hidden="true"
    >
      <div className="atmosphere-grid" />
      <div className="atmosphere-orb atmosphere-orb--violet" />
      <div className="atmosphere-orb atmosphere-orb--gold" />
      {spotlight && !reduced && (
        <div
          className="spotlight"
          style={{ "--spot-x": spot.x, "--spot-y": spot.y }}
        />
      )}
    </div>
  );
}
