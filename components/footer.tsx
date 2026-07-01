"use client";

import { ArrowUp, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

import { navLinks, site } from "@/lib/site";
import { Magnetic } from "@/components/magnetic";

const socials = [
  { label: "Instagram", href: site.socials.instagram, icon: Instagram },
  { label: "YouTube", href: site.socials.youtube, icon: Youtube },
  { label: "Facebook", href: site.socials.facebook, icon: Facebook },
  { label: "LinkedIn", href: site.socials.linkedin, icon: Linkedin },
];

export function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]"
      />
      <div className="container-luxe relative py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-serif text-3xl">
              Ahmad <span className="gold-text">Mullick</span>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">
              Entrepreneur, public figure and mentor — building businesses,
              creating opportunities and inspiring the next generation.
            </p>
            <div className="mt-8 flex gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <Magnetic key={label} strength={0.4}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-all duration-300 hover:border-gold hover:bg-gold hover:text-ink"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow !text-gold">Quick Links</p>
            <ul className="mt-6 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-cream/60 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow !text-gold">Contact</p>
            <ul className="mt-6 space-y-3 text-sm text-cream/60">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="transition-colors hover:text-gold"
                >
                  {site.email}
                </a>
              </li>
              <li>{site.phone}</li>
              <li>{site.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-cream/10 pt-8 sm:flex-row">
          <p className="text-xs tracking-wide text-cream/40">
            © {new Date().getFullYear()} Ahmad Mullick. All rights reserved.
          </p>
          <Magnetic strength={0.4}>
            <button
              onClick={scrollTop}
              className="group flex items-center gap-3 text-xs uppercase tracking-luxe text-cream/50 transition-colors hover:text-gold"
              aria-label="Back to top"
            >
              Back to top
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                <ArrowUp className="h-4 w-4" />
              </span>
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}
