"use client";

import Image from "next/image";

import { Reveal, TextReveal, ImageReveal } from "@/components/reveal";

const pillars = [
  {
    year: "Vision",
    title: "Built from ambition",
    text: "From first ventures to established businesses, every step has been guided by a clear vision and relentless discipline.",
  },
  {
    year: "Craft",
    title: "Business as an art form",
    text: "Strategy, brand and execution treated with the same care a craftsman gives his finest work.",
  },
  {
    year: "Impact",
    title: "Giving the ladder back",
    text: "Mentoring emerging founders and sharing the knowledge that turns ideas into enterprises.",
  },
];

export function About() {
  return (
    <section id="about" className="relative py-28 lg:py-40">
      <div className="container-luxe">
        <Reveal>
          <p className="eyebrow">About</p>
        </Reveal>

        <h2 className="headline mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
          <TextReveal text="Who is" />{" "}
          <span className="gold-text italic">
            <TextReveal text="Ahmad Mullick?" />
          </span>
        </h2>

        <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          {/* Portrait */}
          <div className="relative">
            <ImageReveal className="rounded-[2.5rem] shadow-card">
              <Image
                src="/images/portrait-about.svg"
                alt="Ahmad Mullick — editorial portrait"
                width={880}
                height={1100}
                className="h-full w-full rounded-[2.5rem] object-cover"
              />
            </ImageReveal>
            <Reveal
              delay={0.4}
              className="absolute -bottom-8 -right-4 sm:-right-8"
            >
              <div className="glass-card px-7 py-5">
                <p className="font-serif text-3xl text-ink">Est. 2015</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink/50">
                  The journey begins
                </p>
              </div>
            </Reveal>
          </div>

          {/* Copy + mini timeline */}
          <div className="flex flex-col justify-center">
            <Reveal>
              <p className="font-serif text-2xl leading-relaxed text-ink sm:text-3xl">
                An entrepreneur and public figure devoted to one idea —{" "}
                <span className="text-brown italic">
                  that ambition, refined by discipline, becomes legacy.
                </span>
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-xl leading-relaxed text-ink/65">
                Ahmad Mullick has spent the last decade building businesses,
                growing communities and mentoring the next generation of
                founders. His work spans ventures, media and education — always
                with the same signature: uncompromising quality, long-term
                thinking and a belief that success should be shared.
              </p>
            </Reveal>

            <div className="mt-14 space-y-0">
              {pillars.map((item, i) => (
                <Reveal key={item.year} delay={0.1 * i}>
                  <div className="group grid gap-2 border-t border-ink/10 py-7 transition-colors sm:grid-cols-[120px_1fr] sm:gap-8">
                    <p className="text-[11px] font-semibold uppercase tracking-luxe text-gold-dark">
                      {item.year}
                    </p>
                    <div>
                      <h3 className="font-serif text-xl text-ink transition-colors group-hover:text-brown">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/60">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
              <div className="hairline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
