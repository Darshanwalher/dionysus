import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { CORAL } from "./theme";

/* Coral ring that follows the mouse (desktop only). Place at client/src/pages/landing/Cursor.jsx */
export default function Cursor() {
  const x = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  const y = useSpring(useMotionValue(-100), { stiffness: 700, damping: 50 });
  useEffect(() => {
    const m = (e) => { x.set(e.clientX - 14); y.set(e.clientY - 14); };
    window.addEventListener("mousemove", m, { passive: true });
    return () => window.removeEventListener("mousemove", m);
  }, [x, y]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, borderColor: CORAL }}
      className="hidden md:block pointer-events-none fixed top-0 left-0 z-[60] h-7 w-7 rounded-full border-2 transform-gpu"
    />
  );
}