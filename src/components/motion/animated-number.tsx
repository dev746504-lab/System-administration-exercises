"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    if (reduce && ref.current) ref.current.textContent = String(value);
  }, [reduce, value]);

  useEffect(() => {
    if (reduce) return;
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(Math.round(v));
    });
  }, [spring, reduce]);

  return (
    <span ref={ref} className={className}>
      {reduce ? value : 0}
    </span>
  );
}
