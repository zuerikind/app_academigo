"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, defaultTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function MotionSection({
  children,
  className,
  stagger,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.section
      initial={false}
      whileInView="visible"
      viewport={{ once: true, margin: "-48px" }}
      variants={stagger ? staggerContainer : fadeUp}
      transition={defaultTransition}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function MotionItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div initial={false} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
