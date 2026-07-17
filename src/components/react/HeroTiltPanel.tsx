import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface HeroTiltPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps the hero's floating card and gives it a subtle 3D tilt driven by
 * cursor position across the whole hero <section>, not just the card itself.
 */
export default function HeroTiltPanel({ children, className }: HeroTiltPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 60, damping: 20 });
  const springY = useSpring(my, { stiffness: 60, damping: 20 });
  const tiltX = useTransform(springY, (v) => v / -18);
  const tiltY = useTransform(springX, (v) => v / 18);

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 40);
      my.set(((e.clientY - rect.top) / rect.height - 0.5) * 40);
    };
    const handleMouseLeave = () => {
      mx.set(0);
      my.set(0);
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
      className={`will-change-transform ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}
