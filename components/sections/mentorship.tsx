"use client";

import { ArrowRight, Check } from "lucide-react";

import { Reveal, TextReveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/magnetic";

const benefits = [
  "Direct mentorship with Ahmad",
  "Proven business frameworks",
  "A private founders network",
  "Accountability that compounds",
];

export function Mentorship() {
  return (
    <section id="mentorship" className="relative overflow-hidden py-28 lg:py-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-[-10%] top-[20%] h-96 w-96 animate-gradient-drift rounded-full bg-gold/20 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-96 w-96 animate-gradient-drift rounded-full bg-brown/15 blur-[130px] [animation-delay:-9s]" />
      </div>

      <div className="container-luxe relative">
        <div className="glass-card mx-auto max-w-5xl !rounded-[3rem] px-8 py-16 text-center sm:px-16 lg:py-24">
          <Reveal>
            <p className="eyebrow">Mentorship</p>
          </Reveal>

          <h2 className="headline mx-auto mt-6 max-w-3xl text-4xl sm:text-6xl lg:text-7xl">
            <TextReveal text="Become part of the" />{" "}
            <span className="gold-text italic">
              <TextReveal text="community." />
            </span>
          </h2>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-xl leading-relaxed text-ink/65">
              Work directly with Ahmad and a circle of driven founders. Learn
              the strategies, systems and mindset that turn ambition into
              enterprise — and enterprise into legacy.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <ul className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-ink/70">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold-dark">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Magnetic>
                <Button asChild size="lg" variant="gold" className="px-12">
                  <a href="#contact">
                    Book Mentorship
                    <ArrowRight />
                  </a>
                </Button>
              </Magnetic>
              <p className="w-full text-xs uppercase tracking-[0.25em] text-ink/40 sm:w-auto">
                Limited seats · By application
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
