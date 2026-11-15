import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IV, TEAL, CORAL, INK, ease } from "../theme";

/* Sticky top bar. Place at client/src/pages/landing/sections/Header.jsx */
export default function Header() {
  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease }}
      className="sticky top-0 z-40 border-b"
      style={{ background: `${IV}f5`, borderColor: `${INK}14` }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="dn-d flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <motion.span whileHover={{ rotate: 90 }} className="h-7 w-7 rounded-lg grid place-items-center shadow-sm" style={{ background: TEAL }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORAL }} />
          </motion.span>
          Dionysus
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/login" className="lnk">Sign in</Link>
          <Link to="/register" className="rounded-full px-4 py-2 hover:opacity-90 transition-opacity shadow-sm" style={{ background: INK, color: IV }}>
            Connect a repo
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}