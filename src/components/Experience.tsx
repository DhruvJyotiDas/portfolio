import { experience } from "@/data/experience";
import { Logo } from "./Logo";

export function Experience() {
  return (
    <section id="experience" data-formation="3">
      <div className="sec-head">
        <span className="sec-idx">02</span><span className="sec-title">Experience</span>
        <span className="sec-note">research labs and the teams I lead</span>
      </div>
      <div className="exp">
        {experience.map((e) => (
          <article className="exp-row" key={e.org + e.role}>
            <div className="exp-org">
              <Logo slug={e.logo} name={e.org} />
              <div>
                <h3>{e.org}</h3>
                <span className={`exp-type ${e.type}`}>{e.type}</span>
              </div>
            </div>
            <div className="exp-body">
              <div className="exp-meta">
                <b>{e.role}</b>
                <span>{e.location} · {e.period}</span>
              </div>
              <ul>{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
              <div className="exp-tags">{e.tags.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
