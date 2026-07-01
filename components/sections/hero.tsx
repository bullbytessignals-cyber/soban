"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, MoveDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/magnetic";

const ease = [0.22, 1, 0.36, 1] as const;

const roles = [
  "Entrepreneur",
  "Public Figure",
  "Business Mentor",
  "Content Creator",
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // Mouse parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 20 });
  const smy = useSpring(my, { stiffness: 60, damping: 20 });
  const portraitX = useTransform(smx, [-0.5, 0.5], [-18, 18]);
  const portraitY = useTransform(smy, [-0.5, 0.5], [-12, 12]);
  const glowX = useTransform(smx, [-0.5, 0.5], [30, -30]);
  const glowY = useTransform(smy, [-0.5, 0.5], [20, -20]);

  // Scroll parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const portraitScrollY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative flex min-h-screen items-center overflow-hidden pt-24"
    >
      {/* Animated gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: glowX, y: glowY }}
          className="absolute -left-32 top-[-10%] h-[34rem] w-[34rem] animate-gradient-drift rounded-full bg-gold/25 blur-[130px]"
        />
        <motion.div
          style={{ x: glowY, y: glowX }}
          className="absolute bottom-[-15%] right-[-8%] h-[38rem] w-[38rem] animate-gradient-drift rounded-full bg-brown/20 blur-[140px] [animation-delay:-6s]"
        />
        <div className="absolute right-[20%] top-[15%] h-72 w-72 animate-gradient-drift rounded-full bg-white/50 blur-[100px] [animation-delay:-12s]" />
      </div>

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="container-luxe relative z-10 grid items-center gap-16 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8"
      >
        {/* Left — copy */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="eyebrow"
          >
            Official Website
          </motion.p>

          <h1 className="headline mt-6 text-[13vw] sm:text-7xl lg:text-[5.2rem] xl:text-[6rem]">
            <span className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, delay: 0.4, ease }}
              >
                Ahmad
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span
                className="gold-text block italic"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, delay: 0.55, ease }}
              >
                Mullick
              </motion.span>
            </span>
          </h1>

          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } },
            }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
          >
            {roles.map((role) => (
              <motion.li
                key={role}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                }}
                className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.2em] text-ink/60"
              >
                <span className="h-1 w-1 rounded-full bg-gold" />
                {role}
              </motion.li>
            ))}
          </motion.ul>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2, ease }}
            className="mt-8 max-w-lg text-lg leading-relaxed text-ink/70"
          >
            Building businesses, creating opportunities, sharing knowledge and
            inspiring the next generation of entrepreneurs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.4, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <Button asChild size="lg">
                <a href="#journey">
                  Explore Journey
                  <ArrowRight />
                </a>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild size="lg" variant="outline">
                <a href="#contact">Get in Touch</a>
              </Button>
            </Magnetic>
          </motion.div>
        </div>

        {/* Right — portrait */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease }}
          style={{ y: portraitScrollY }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <motion.div style={{ x: portraitX, y: portraitY }} className="relative">
            <div
              aria-hidden
              className="absolute inset-x-6 bottom-0 top-16 rounded-[3rem] border border-white/60 bg-gradient-to-b from-white/70 to-gold/20 shadow-card backdrop-blur-sm"
            />
            <Image
              src="/images/portrait-hero.svg"
              alt="Portrait of Ahmad Mullick"
              width={720}
              height={900}
              priority
              className="relative z-10 mx-auto h-auto w-full max-w-[26rem] drop-shadow-2xl lg:max-w-[30rem]"
            />
            <div
              aria-hidden
              className="absolute -right-4 top-24 z-20 hidden rounded-2xl border border-white/60 bg-white/70 px-5 py-4 shadow-soft backdrop-blur-xl sm:block"
            >
              <p className="font-serif text-2xl text-ink">10+ Yrs</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
                Experience
              </p>
            </div>
            <div
              aria-hidden
              className="absolute -left-4 bottom-24 z-20 hidden rounded-2xl border border-white/60 bg-white/70 px-5 py-4 shadow-soft backdrop-blur-xl sm:block"
            >
              <p className="font-serif text-2xl text-ink">1M+</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
                Community
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-ink/50 transition-colors hover:text-ink"
        aria-label="Scroll to about section"
      >
        <span className="text-[10px] uppercase tracking-luxe">Scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-6 items-start justify-center rounded-full border border-ink/20 pt-2"
        >
          <MoveDown className="h-3 w-3" />
        </motion.span>
      </motion.a>
    </section>
  );
}
