import * as THREE from "three";

function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Returns 4 formations (core, clusters, lattice, globe) + per-point color/seed buffers.
export function buildField(N: number) {
  const formations: Float32Array[] = [];

  // 0 — core: gaussian sphere
  {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 6 + gauss() * 2.2;
      const th = Math.random() * 6.283;
      const ph = Math.acos(2 * Math.random() - 1);
      a[i * 3] = r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      a[i * 3 + 2] = r * Math.cos(ph);
    }
    formations.push(a);
  }
  // 1 — clusters: t-SNE-like
  {
    const c = [[-9, 4, -2], [8, -3, 1], [1, 10, -4], [-4, -9, 3], [11, 7, -3], [-12, -2, -1]];
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const k = c[i % c.length];
      a[i * 3] = k[0] + gauss() * 2.6;
      a[i * 3 + 1] = k[1] + gauss() * 2.6;
      a[i * 3 + 2] = k[2] + gauss() * 2.6;
    }
    formations.push(a);
  }
  // 2 — lattice: jittered grid
  {
    const a = new Float32Array(N * 3);
    const s = Math.ceil(Math.cbrt(N));
    const g = 2.6;
    let i = 0;
    for (let x = 0; x < s && i < N; x++)
      for (let y = 0; y < s && i < N; y++)
        for (let z = 0; z < s && i < N; z++) {
          a[i * 3] = (x - s / 2) * g + Math.random() * 0.4;
          a[i * 3 + 1] = (y - s / 2) * g + Math.random() * 0.4;
          a[i * 3 + 2] = (z - s / 2) * g + Math.random() * 0.4;
          i++;
        }
    formations.push(a);
  }
  // 3 — globe: shell + ring (satellite)
  {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      if (i % 7 === 0) {
        const t = Math.random() * 6.283, R = 12.5;
        a[i * 3] = R * Math.cos(t);
        a[i * 3 + 1] = R * Math.sin(t) * 0.32;
        a[i * 3 + 2] = R * Math.sin(t);
      } else {
        const th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1), R = 9;
        a[i * 3] = R * Math.sin(ph) * Math.cos(th);
        a[i * 3 + 1] = R * Math.sin(ph) * Math.sin(th);
        a[i * 3 + 2] = R * Math.cos(ph);
      }
    }
    formations.push(a);
  }

  const colors = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  const c1 = new THREE.Color(0x7fe3d0), c2 = new THREE.Color(0x356b76), c3 = new THREE.Color(0xe8b25c);
  for (let i = 0; i < N; i++) {
    const m = Math.random();
    const cc = m > 0.94 ? c3 : m > 0.5 ? c1 : c2;
    colors[i * 3] = cc.r; colors[i * 3 + 1] = cc.g; colors[i * 3 + 2] = cc.b;
    seeds[i] = Math.random() * 6.283;
  }

  return { formations, colors, seeds };
}

export const FORMATION_NAMES = ["core", "clusters", "lattice", "globe"];
