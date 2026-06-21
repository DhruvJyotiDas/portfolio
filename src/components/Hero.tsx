import { education } from "@/data/experience";
import { Logo } from "./Logo";

export function Hero() {
  return (
    <header className="hero" data-formation="0">
      <div className="eyebrow">AI Researcher · Engineer · Builder</div>
      <h1 className="name"><span>Dhruv Jyoti</span><span>Das</span></h1>
      <p className="lede">
        I build intelligent systems that learn across <b>language, vision, and time</b> — self-supervised
        representations on satellite time-series, dynamic computation inside transformers, and real-time
        systems that ship.
      </p>
      <div className="edu">
        {education.map((e) => (
          <div className="edu-item" key={e.org}>
            <Logo slug={e.logo} name={e.org} size={26} />
            <div><b>{e.org}</b><span>{e.line}</span></div>
          </div>
        ))}
      </div>
      <div className="scrollcue">↓ scroll — the field rebuilds per section · press <b>`</b> for terminal</div>
    </header>
  );
}
