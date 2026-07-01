"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Mic, Play, Youtube } from "lucide-react";

import { Reveal, TextReveal } from "@/components/reveal";

const videos = [
  {
    platform: "Instagram Reels",
    icon: Instagram,
    title: "Behind the Business",
    description: "Daily lessons, lifestyle and the reality of building companies — in 60 seconds.",
    image: "/images/video-1.svg",
    tag: "Reels",
  },
  {
    platform: "YouTube",
    icon: Youtube,
    title: "The Long Game",
    description: "In-depth breakdowns of strategy, sales and scaling — the full story, unfiltered.",
    image: "/images/video-2.svg",
    tag: "YouTube",
  },
  {
    platform: "Podcast",
    icon: Mic,
    title: "Mullick Unplugged",
    description: "Conversations with founders, creators and leaders shaping the next decade.",
    image: "/images/video-3.svg",
    tag: "Podcast",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Videos() {
  return (
    <section id="videos" className="relative py-28 lg:py-40">
      <div className="container-luxe">
        <Reveal>
          <p className="eyebrow">Videos</p>
        </Reveal>
        <h2 className="headline mt-6 max-w-3xl text-4xl sm:text-6xl">
          <TextReveal text="Stories in" />{" "}
          <span className="gold-text italic">
            <TextReveal text="motion." />
          </span>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:mt-24">
          {videos.map((video, i) => {
            const Icon = video.icon;
            return (
              <motion.article
                key={video.platform}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.9, delay: i * 0.12, ease }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-soft transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card">
                  <Image
                    src={video.image}
                    alt={video.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

                  <span className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    <Icon className="h-3.5 w-3.5" />
                    {video.tag}
                  </span>

                  {/* Play button */}
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-gold group-hover:text-ink">
                    <Play className="ml-0.5 h-6 w-6 fill-current" />
                  </span>

                  <div className="absolute inset-x-6 bottom-6 text-white">
                    <h3 className="font-serif text-2xl">{video.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {video.description}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
