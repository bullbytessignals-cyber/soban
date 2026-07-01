"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { Reveal, TextReveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/magnetic";

const projects = [
  {
    title: "The Venture Group",
    category: "Business",
    description:
      "A portfolio of businesses built from the ground up — spanning trade, services and digital.",
    image: "/images/project-1.svg",
  },
  {
    title: "Mullick Media",
    category: "Content",
    description:
      "A content studio producing business education, brand stories and cinematic short-form media.",
    image: "/images/project-2.svg",
  },
  {
    title: "The Founders Circle",
    category: "Mentorship",
    description:
      "A private mentorship community where ambitious founders learn strategy, sales and scale.",
    image: "/images/project-3.svg",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Projects() {
  return (
    <section id="projects" className="relative py-28 lg:py-40">
      <div className="container-luxe">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal>
              <p className="eyebrow">Featured Projects</p>
            </Reveal>
            <h2 className="headline mt-6 max-w-2xl text-4xl sm:text-6xl">
              <TextReveal text="Ventures built with" />{" "}
              <span className="gold-text italic">
                <TextReveal text="intention." />
              </span>
            </h2>
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-sm text-sm leading-relaxed text-ink/60">
              A selection of businesses and platforms — each one designed to
              last, crafted to lead.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:mt-24 lg:grid-cols-3">
          {projects.map((project, i) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: i * 0.12, ease }}
              className="group relative"
            >
              <div className="glass-card overflow-hidden !rounded-[2rem] p-3 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem]">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    {project.category}
                  </span>
                  <span className="absolute right-5 top-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-gold text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                  <div className="absolute inset-x-5 bottom-5 text-white">
                    <h3 className="font-serif text-2xl">{project.title}</h3>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-5">
                  <p className="text-sm leading-relaxed text-ink/60">
                    {project.description}
                  </p>
                  <Magnetic strength={0.2} className="mt-5">
                    <Button variant="outline" size="sm">
                      View Details
                      <ArrowUpRight />
                    </Button>
                  </Magnetic>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
