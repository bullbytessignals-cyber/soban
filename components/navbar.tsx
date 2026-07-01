"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/magnetic";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-ink/5 bg-cream/80 shadow-soft backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <nav className="container-luxe flex h-20 items-center justify-between">
          <Link
            href="#"
            className="group flex items-baseline gap-1 font-serif text-xl tracking-tight text-ink"
            aria-label="Ahmad Mullick — home"
          >
            Ahmad
            <span className="gold-text transition-opacity group-hover:opacity-80">
              Mullick
            </span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative text-[13px] font-medium uppercase tracking-[0.18em] text-ink/70 transition-colors hover:text-ink"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <Magnetic>
              <Button asChild size="sm">
                <a href="#contact">Get in Touch</a>
              </Button>
            </Magnetic>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] flex flex-col bg-cream/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="container-luxe flex h-20 items-center justify-between">
              <span className="font-serif text-xl text-ink">
                Ahmad <span className="gold-text">Mullick</span>
              </span>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container-luxe flex flex-1 flex-col justify-center gap-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif text-4xl text-ink transition-colors hover:text-brown sm:text-5xl"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * navLinks.length, duration: 0.6 }}
                className="mt-8"
              >
                <Button asChild size="lg" variant="gold" onClick={() => setOpen(false)}>
                  <a href="#contact">Get in Touch</a>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
