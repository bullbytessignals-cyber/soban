"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { Reveal, TextReveal } from "@/components/reveal";

const photos = [
  { src: "/images/gallery-1.svg", alt: "Ahmad Mullick — evening portrait", ratio: "aspect-[3/4]" },
  { src: "/images/gallery-2.svg", alt: "Ahmad Mullick — city lights", ratio: "aspect-[4/5]" },
  { src: "/images/gallery-3.svg", alt: "Ahmad Mullick — black tie event", ratio: "aspect-[3/4]" },
  { src: "/images/gallery-4.svg", alt: "Ahmad Mullick — street style", ratio: "aspect-square" },
  { src: "/images/gallery-5.svg", alt: "Ahmad Mullick — automotive lifestyle", ratio: "aspect-[4/5]" },
  { src: "/images/gallery-6.svg", alt: "Ahmad Mullick — editorial look", ratio: "aspect-[3/4]" },
  { src: "/images/gallery-7.svg", alt: "Ahmad Mullick — night drive", ratio: "aspect-square" },
  { src: "/images/gallery-8.svg", alt: "Ahmad Mullick — behind the scenes", ratio: "aspect-[4/5]" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setActive((cur) =>
        cur === null ? cur : (cur + dir + photos.length) % photos.length
      ),
    []
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  return (
    <section id="gallery" className="relative bg-white py-28 lg:py-40">
      <div className="container-luxe">
        <Reveal>
          <p className="eyebrow">Media Gallery</p>
        </Reveal>
        <h2 className="headline mt-6 max-w-3xl text-4xl sm:text-6xl">
          <TextReveal text="Moments," />{" "}
          <span className="gold-text italic">
            <TextReveal text="captured." />
          </span>
        </h2>

        {/* Masonry */}
        <div className="mt-16 columns-2 gap-5 lg:mt-24 lg:columns-3 xl:columns-4 [&>*]:mb-5">
          {photos.map((photo, i) => (
            <motion.button
              key={photo.src}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease }}
              className={`group relative block w-full overflow-hidden rounded-3xl ${photo.ratio} break-inside-avoid shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold`}
              aria-label={`Open photo: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/30" />
              <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-50 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 backdrop-blur transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                <Plus className="h-5 w-5" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-xl sm:p-10"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Photo lightbox"
          >
            <button
              onClick={close}
              className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-ink"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-ink sm:left-8"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-ink sm:right-8"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease }}
              className="relative h-[80vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={photos[active].src}
                alt={photos[active].alt}
                fill
                sizes="90vw"
                className="rounded-2xl object-contain"
              />
              <p className="absolute -bottom-8 left-0 right-0 text-center text-xs uppercase tracking-[0.25em] text-white/50">
                {active + 1} / {photos.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
