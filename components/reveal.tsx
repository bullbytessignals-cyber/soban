"use client";

import { motion, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

/** Fade-and-rise reveal on scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Scale-in reveal for images and cards. */
export function ScaleReveal({
  children,
  className,
  delay = 0,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.1, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const lineContainer: Variants = {
  hidden: {},
  visible: (stagger: number = 0.08) => ({
    transition: { staggerChildren: stagger },
  }),
};

const lineChild: Variants = {
  hidden: { y: "110%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.9, ease },
  },
};

interface TextRevealProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  stagger?: number;
}

/** Word-by-word masked text reveal. */
export function TextReveal({
  text,
  className,
  as: Tag = "span",
  stagger = 0.05,
}: TextRevealProps) {
  const words = text.split(" ");
  return (
    <Tag className={cn("inline-block", className)}>
      <motion.span
        className="inline"
        variants={lineContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        custom={stagger}
        aria-label={text}
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden pb-[0.12em] align-bottom"
            aria-hidden
          >
            <motion.span className="inline-block" variants={lineChild}>
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/** Curtain-style image reveal: cover slides away while image scales down. */
export function ImageReveal({
  children,
  className,
  delay = 0,
}: RevealProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        initial={{ scale: 1.18 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.4, delay, ease }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute inset-0 z-10 bg-cream"
        initial={{ y: "0%" }}
        whileInView={{ y: "-101%" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.1, delay, ease }}
      />
    </div>
  );
}
