"use client";

import { useState } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  Youtube,
} from "lucide-react";

import { site } from "@/lib/site";
import { Reveal, TextReveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/magnetic";

const details = [
  { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
  { icon: Phone, label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}` },
  { icon: MapPin, label: "Location", value: site.location },
];

const socials = [
  { label: "Instagram", href: site.socials.instagram, icon: Instagram },
  { label: "YouTube", href: site.socials.youtube, icon: Youtube },
  { label: "Facebook", href: site.socials.facebook, icon: Facebook },
  { label: "LinkedIn", href: site.socials.linkedin, icon: Linkedin },
];

const inputClass =
  "w-full rounded-2xl border border-ink/10 bg-white/70 px-5 py-4 text-sm text-ink placeholder:text-ink/35 backdrop-blur transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

export function Contact() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = encodeURIComponent(
      `Website inquiry from ${data.get("name")}`
    );
    const body = encodeURIComponent(
      `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`
    );
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section id="contact" className="relative bg-white py-28 lg:py-40">
      <div className="container-luxe">
        <Reveal>
          <p className="eyebrow">Contact</p>
        </Reveal>
        <h2 className="headline mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
          <TextReveal text="Let's build something" />{" "}
          <span className="gold-text italic">
            <TextReveal text="extraordinary." />
          </span>
        </h2>

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Details */}
          <div>
            <Reveal>
              <p className="max-w-md leading-relaxed text-ink/60">
                For business inquiries, partnerships, media requests or
                mentorship applications — reach out directly. Every message is
                read.
              </p>
            </Reveal>

            <div className="mt-10 space-y-4">
              {details.map(({ icon: Icon, label, value, href }, i) => (
                <Reveal key={label} delay={0.1 * i}>
                  <div className="glass-card flex items-center gap-5 !rounded-2xl px-6 py-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/40">
                        {label}
                      </p>
                      {href ? (
                        <a
                          href={href}
                          className="mt-0.5 block text-sm font-medium text-ink transition-colors hover:text-brown"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.35}>
              <div className="mt-8 flex gap-3">
                {socials.map(({ label, href, icon: Icon }) => (
                  <Magnetic key={label} strength={0.4}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-all duration-300 hover:border-ink hover:bg-ink hover:text-gold"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Magnetic>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-10 overflow-hidden rounded-3xl shadow-soft">
                <iframe
                  title="Ahmad Mullick — location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(site.location)}&output=embed`}
                  className="h-64 w-full border-0 grayscale transition-all duration-700 hover:grayscale-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </Reveal>
          </div>

          {/* Form */}
          <Reveal delay={0.15}>
            <form
              onSubmit={onSubmit}
              className="glass-card !rounded-[2.5rem] p-8 sm:p-12"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <label htmlFor="name" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink/50">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-1">
                  <label htmlFor="email" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink/50">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="subject" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink/50">
                    Subject
                  </label>
                  <select id="subject" name="subject" className={inputClass} defaultValue="Business Inquiry">
                    <option>Business Inquiry</option>
                    <option>Mentorship Application</option>
                    <option>Media & Press</option>
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink/50">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="Tell me about your project or inquiry…"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <Magnetic>
                  <Button type="submit" size="lg" className="px-12">
                    Send Message
                    <Send />
                  </Button>
                </Magnetic>
                {sent && (
                  <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
                    Opening your email client…
                  </p>
                )}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
