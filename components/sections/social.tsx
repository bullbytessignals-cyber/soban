"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
} from "framer-motion";
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Youtube,
} from "lucide-react";

import { site } from "@/lib/site";
import { Reveal, TextReveal } from "@/components/reveal";

const platforms = [
  {
    name: "Instagram",
    handle: "@ahmadmullick",
    count: 850,
    suffix: "K",
    label: "Followers",
    icon: Instagram,
    href: site.socials.instagram,
  },
  {
    name: "YouTube",
    handle: "@ahmadmullick",
    count: 320,
    suffix: "K",
    label: "Subscribers",
    icon: Youtube,
    href: site.socials.youtube,
  },
  {
    name: "TikTok",
    handle: "@ahmadmullick",
    count: 1.2,
    suffix: "M",
    label: "Followers",
    icon: Music2,
    href: site.socials.tiktok,
    decimals: 1,
  },
  {
    name: "Facebook",
    handle: "Ahmad Mullick",
    count: 400,
    suffix: "K",
    label: "Followers",
    icon: Facebook,
    href: site.socials.facebook,
  },
  {
    name: "LinkedIn",
    handle: "Ahmad Mullick",
    count: 95,
    suffix: "K",
    label: "Connections",
    icon: Linkedin,
    href: site.socials.linkedin,
  },
];

function Counter({
  value,
  suffix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = latest.toFixed(decimals);
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals]);

  return (
    <span>
      <span ref={ref}>0</span>
      <span className="gold-text">{suffix}</span>
    </span>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Social() {
  return (
    <section id="social" className="relative overflow-hidden bg-ink py-28 text-cream lg:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-20%] h-[40rem] w-[70%] -translate-x-1/2 rounded-full bg-gold/10 blur-[160px]"
      />

      <div className="container-luxe relative">
        <Reveal>
          <p className="eyebrow !text-gold">Social Media</p>
        </Reveal>
        <h2 className="headline mt-6 max-w-4xl !text-cream text-4xl sm:text-6xl lg:text-7xl">
          <TextReveal text="A community of" />{" "}
          <span className="gold-text italic">
            <TextReveal text="millions." />
          </span>
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl leading-relaxed text-cream/60">
            Across every platform, one voice — real business knowledge,
            unfiltered lessons and a front-row seat to the journey.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:mt-24 lg:grid-cols-5">
          {platforms.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease }}
                className="glass-dark group flex flex-col justify-between gap-10 p-7 transition-all duration-500 hover:-translate-y-2 hover:border-gold/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cream/15 text-cream/80 transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-cream/30 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-gold" />
                </div>
                <div>
                  <p className="font-serif text-4xl">
                    <Counter
                      value={p.count}
                      suffix={p.suffix}
                      decimals={p.decimals ?? 0}
                    />
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-cream/40">
                    {p.label}
                  </p>
                  <p className="mt-4 text-sm text-cream/60">{p.name}</p>
                  <p className="text-xs text-cream/35">{p.handle}</p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
