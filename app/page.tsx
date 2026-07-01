import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Journey } from "@/components/sections/journey";
import { Projects } from "@/components/sections/projects";
import { Gallery } from "@/components/sections/gallery";
import { Videos } from "@/components/sections/videos";
import { Social } from "@/components/sections/social";
import { Mentorship } from "@/components/sections/mentorship";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Journey />
        <Projects />
        <Gallery />
        <Videos />
        <Social />
        <Mentorship />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
