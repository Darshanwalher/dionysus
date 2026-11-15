/**
 * Landing page: this file only assembles the sections and holds the page-wide effects.
 * Place at client/src/pages/landing/LandingPage.jsx (keep Hero3D.jsx and useSmoothScroll.js beside it).
 *
 *   landing/
 *     LandingPage.jsx        (this file)
 *     theme.js               colours, GITHUB_URL, global CSS
 *     ui.jsx                 Line, Head, Bullets, Panel, Btn, LiveBadge, Counter, Typed
 *     useSectionAnim.js      reversible scroll animation helper
 *     Cursor.jsx  Hero3D.jsx  useSmoothScroll.js
 *     sections/
 *       Header  Challenge  DiscoverMap (+ Graph)  Marquee  Capabilities  Ask  Meetings
 *       DeepWikiSection  Features  Pipeline  HowItWorks  Terminal  FAQ  Cta  Footer
 *
 * Every scroll animation plays going down and plays backwards when you scroll back up.
 */
import { useEffect } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hero3D from "./Hero3D";
import useSmoothScroll from "./useSmoothScroll";
import Cursor from "./Cursor";
import { Btn } from "./ui";
import { FONTS, IV, INK, CORAL } from "./theme";

import Header from "./sections/Header";
import Challenge from "./sections/Challenge";
import DiscoverMap from "./sections/DiscoverMap";
import Marquee from "./sections/Marquee";
import Capabilities from "./sections/Capabilities";
import Ask from "./sections/Ask";
import Meetings from "./sections/Meetings";
import DeepWikiSection from "./sections/DeepWikiSection";
import Features from "./sections/Features";
import Pipeline from "./sections/Pipeline";
import HowItWorks from "./sections/HowItWorks";
import Terminal from "./sections/Terminal";
import FAQ from "./sections/FAQ";
import Cta from "./sections/Cta";
import Footer from "./sections/Footer";

export default function LandingPage() {
  const calm = useReducedMotion();
  useSmoothScroll(calm);

  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  // Fonts and images change section heights, so recalculate every trigger once they are ready
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  return (
    <div className="dn min-h-screen antialiased" style={{ background: IV, color: INK }}>
      <style>{FONTS}</style>
      <Cursor />

      {/* Scroll progress */}
      <motion.div style={{ scaleX: bar, background: CORAL }} className="fixed top-0 inset-x-0 z-50 h-1 origin-left transform-gpu" />

      <Header />
      <Hero3D calm={calm} Btn={Btn} />
      <Challenge />
      <DiscoverMap />
      <Marquee />
      <Capabilities />
      <Ask />
      <Meetings />
      <DeepWikiSection />
      <Features />
      <Pipeline />
      <HowItWorks />
      <Terminal />
      <FAQ />
      <Cta />
      <Footer />
    </div>
  );
}