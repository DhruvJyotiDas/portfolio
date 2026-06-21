import FieldMount from "@/components/FieldMount";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/Hero";
import { ResearchThreads } from "@/components/ResearchThreads";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { Instruments } from "@/components/Instruments";
import { Ask } from "@/components/Ask";
import { Terminal } from "@/components/Terminal";

export default function Page() {
  return (
    <>
      <FieldMount />
      <div className="field-veil" />
      <TopBar />
      <div className="wrap">
        <Hero />
        <ResearchThreads />
        <Experience />
        <Projects />
        <Instruments />
        <Ask />
        <footer className="foot" id="contact" data-formation="0">
          <div className="ftitle">Building intelligent systems. Open to work, 2027.</div>
          <div className="links">
            <a href="mailto:dd4708@srmist.edu.in">dd4708@srmist.edu.in</a>
            <a href="#">GitHub ↗</a>
            <a href="#">LinkedIn ↗</a>
            <a href="#">Research CV (PDF) ↗</a>
          </div>
          <div className="colophon">
            Interests: self-supervised spatiotemporal learning · efficient / dynamic transformers · alignment for low-resource languages.<br />
            Built and self-hosted. The Three.js field morphs across four formations: core · clusters · lattice · globe.
          </div>
        </footer>
      </div>
      <Terminal />
    </>
  );
}
