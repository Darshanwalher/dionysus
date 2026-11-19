import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { CORAL } from "./theme";
import usePerfTier from "./usePerfTier";

/* Coral ring that follows the mouse (desktop only). Place at client/src/pages/landing/Cursor.jsx */
export default function Cursor() {
  const tier = usePerfTier();
  const x = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  const y = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  useEffect(() => {
    if (tier !== "high") return;
    const m = (e) => { x.set(e.clientX - 14); y.set(e.clientY - 14); };
    window.addEventListener("mousemove", m, { passive: true });
    return () => window.removeEventListener("mousemove", m);
  }, [x, y, tier]);
  if (tier !== "high") return null; // the ring springs on every mouse move: skip it on battery / slow devices
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, borderColor: CORAL }}
      className="hidden md:block pointer-events-none fixed top-0 left-0 z-[60] h-7 w-7 rounded-full border-2 transform-gpu"
    />
  );
}