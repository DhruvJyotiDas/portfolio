"use client";
import { useState } from "react";

export function Logo({ slug, name, size = 38 }: { slug: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (err) {
    return (
      <div className="logo-mono" style={{ width: size, height: size }} aria-label={name}>
        {initials}
      </div>
    );
  }
  return (
    // Drop a real SVG/PNG at public/logos/<slug>.svg to replace the monogram.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logos/${slug}.svg`}
      alt={name}
      width={size}
      height={size}
      className="logo-img"
      onError={() => setErr(true)}
    />
  );
}
