"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Award, Briefcase, Globe, Rocket, Sparkles, Users } from "lucide-react";

import { Reveal, TextReveal } from "@/components/reveal";

gsap.registerPlugin(ScrollTrigger);

const milestones = [
  {
    year: "2015",
    title: "The First Venture",
    text: "Started the first business with nothing but conviction — learning sales, product and persistence the hard way.",
    icon: Rocket,
  },
  {
    year: "2017",
    title: "Scaling Up",
    text: "Expanded into new markets, built the first real team and turned a hustle into a structured company.",
    icon: Briefcase,
  },
  {
    year: "2019",
    title: "Going Public",
    text: "Began sharing the journey online — business breakdowns, lessons and behind-the-scenes of building companies.",
    icon: Globe,
  },
  {
    year: "2021",
    title: "A Community Forms",
    text: "The audience became a community. Hundreds of thousands of followers across platforms tuning in for real business knowledge.",
    icon: Users,
  },
  {
    year: "2023",
    title: "Mentorship Era",
    text: "Launched structured mentorship — helping emerging entrepreneurs skip years of trial and error.",
    icon: Award,
  },
  {
    year: "Today",
    title: "Building the Next Chapter",
    text: "New ventures, bigger stages and one mission: inspiring the next generation to build boldly.",
    icon: Sparkles,
  },
];

export function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Growing gold line
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 80%",
            scrub: 0.6,
          },
        }
      );

      // Card reveals
      gsap.utils
        .toArray<HTMLElement>("[data-journey-card]")
        .forEach((card, i) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 60, x: i % 2 === 0 ? -30 : 30 },
            {
              opacity: 1,
              y: 0,
              x: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 82%",
              },
            }
          );
        });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative overflow-hidden bg-ink py-28 text-cream lg:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 right-[-10%] h-[30rem] w-[30rem] rounded-full bg-brown/25 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-gold/15 blur-[140px]"
      />

      <div className="container-luxe relative">
        <Reveal>
          <p className="eyebrow !text-gold">The Journey</p>
        </Reveal>
        <h2 className="headline mt-6 max-w-3xl !text-cream text-4xl sm:text-6xl lg:text-7xl">
          <TextReveal text="A decade of" />{" "}
          <span className="gold-text italic">
            <TextReveal text="relentless building." />
          </span>
        </h2>

        <div className="relative mx-auto mt-20 max-w-4xl lg:mt-28">
          {/* Center line */}
          <div
            aria-hidden
            className="absolute left-5 top-0 h-full w-px bg-cream/10 sm:left-1/2 sm:-translate-x-1/2"
          >
            <div
              ref={lineRef}
              className="h-full w-full origin-top bg-gradient-to-b from-gold via-gold to-brown"
            />
          </div>

          <div className="space-y-12 sm:space-y-20">
            {milestones.map((m, i) => {
              const Icon = m.icon;
              const left = i % 2 === 0;
              return (
                <div
                  key={m.year}
                  className={`relative flex sm:w-1/2 ${
                    left ? "sm:pr-14" : "sm:ml-auto sm:pl-14"
                  } pl-14 sm:pl-0 ${left ? "" : "sm:pl-14"}`}
                >
                  {/* Node */}
                  <span
                    aria-hidden
                    className={`absolute top-8 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-ink shadow-gold ${
                      left
                        ? "left-0 sm:left-auto sm:right-0 sm:translate-x-1/2"
                        : "left-0 sm:-translate-x-1/2"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-gold" />
                  </span>

                  <article
                    data-journey-card
                    className="glass-dark group w-full p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/30 sm:p-8"
                  >
                    <p className="font-serif text-3xl gold-text">{m.year}</p>
                    <h3 className="mt-3 font-serif text-xl text-cream transition-colors group-hover:text-gold-light">
                      {m.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-cream/60">
                      {m.text}
                    </p>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
