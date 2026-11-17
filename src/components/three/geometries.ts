import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Cheap deterministic 3D noise (sum of sines) — good enough for organic lumps. */
export function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 3.1 + y * 1.7 + 0.3) * Math.cos(z * 2.3 + 0.5) * 0.5 +
    Math.sin(x * 6.7 - z * 5.3 + y * 2.1) * 0.25 +
    Math.sin(y * 9.1 + x * 4.3 - z * 7.7) * 0.12
  );
}

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function lumpy(base: THREE.BufferGeometry, amp: number, freq: number, scale: [number, number, number], colors: [string, string, string?], colorFreq = 4) {
  let g = base.toNonIndexed();
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c1 = new THREE.Color(colors[0]), c2 = new THREE.Color(colors[1]), c3 = colors[2] ? new THREE.Color(colors[2]) : null;
  const v = new THREE.Vector3();
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const d = 1 + noise3(n.x * freq, n.y * freq, n.z * freq) * amp;
    v.multiplyScalar(d);
    v.set(v.x * scale[0], v.y * scale[1], v.z * scale[2]);
    pos.setXYZ(i, v.x, v.y, v.z);
    const t = THREE.MathUtils.clamp(0.5 + noise3(n.x * colorFreq + 3, n.y * colorFreq, n.z * colorFreq - 2) * 0.9, 0, 1);
    tmp.copy(c1).lerp(c2, t);
    if (c3 && noise3(n.x * 11, n.y * 13, n.z * 9) > 0.55) tmp.copy(c3);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export const makeChicken = () =>
  lumpy(new THREE.IcosahedronGeometry(0.15, 3), 0.32, 1.6, [1.35, 0.85, 1], ["#b24a1c", "#6e1e0c", "#d9822f"], 5);

export const makeMango = () =>
  lumpy(new THREE.DodecahedronGeometry(0.15, 1), 0.18, 1.2, [1.25, 0.75, 0.95], ["#e8892a", "#b0240e", "#f6c85a"], 4);

export const makeLaddu = () =>
  lumpy(new THREE.IcosahedronGeometry(0.19, 5), 0.06, 9, [1, 0.96, 1], ["#f2a51f", "#e08a10", "#fff1c9"], 14);

export const makeGarlic = () =>
  lumpy(new THREE.IcosahedronGeometry(0.06, 2), 0.12, 1.4, [0.8, 1.35, 0.8], ["#f6ead0", "#d9c79b"], 2);

export function makeChilli() {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.17, 0), new THREE.Vector3(0.03, -0.05, 0), new THREE.Vector3(0.02, 0.08, 0), new THREE.Vector3(-0.03, 0.17, 0),
  ]);
  const g = new THREE.TubeGeometry(path, 24, 0.032, 10, false);
  // taper the tube toward the tip
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = (v.y + 0.17) / 0.34; // 0 tip .. 1 stem
    const p = path.getPoint(THREE.MathUtils.clamp(t, 0, 1));
    const k = 0.25 + 0.75 * Math.sqrt(THREE.MathUtils.clamp(t, 0, 1));
    pos.setXYZ(i, p.x + (v.x - p.x) * k, v.y, p.z + (v.z - p.z) * k);
  }
  const col = new Float32Array(pos.count * 3);
  const red = new THREE.Color("#c4180f"), green = new THREE.Color("#2f6b3a");
  for (let i = 0; i < pos.count; i++) {
    const c = pos.getY(i) > 0.15 ? green : red;
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/** Traditional glass pickle jar (local height ≈ 2.16). */
export function makeJar() {
  const pts = [
    [0, 0], [0.7, 0], [0.82, 0.03], [0.9, 0.14], [0.92, 0.32], [0.92, 1.55], [0.9, 1.72], [0.84, 1.84],
    [0.77, 1.93], [0.76, 2.04], [0.8, 2.08], [0.8, 2.16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 64);
}

/** Brass uruli bowl for laddus (rim radius ≈ 1.3, height ≈ 0.65). */
export function makeBowl() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(new THREE.Vector2(0.05 + Math.sin(t * Math.PI * 0.5) * 1.25, 0.08 + (1 - Math.cos(t * Math.PI * 0.5)) * 0.55));
  }
  pts.push(new THREE.Vector2(1.38, 0.66), new THREE.Vector2(1.38, 0.7), new THREE.Vector2(1.28, 0.68));
  for (let i = 20; i >= 0; i--) {
    const t = i / 20;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI * 0.5) * 1.2, 0.14 + (1 - Math.cos(t * Math.PI * 0.5)) * 0.52));
  }
  const g = new THREE.LatheGeometry(pts, 72);
  g.computeVertexNormals();
  return g;
}

export function makeLabelTexture(title: string, telugu: string, accent: string) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 300;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fbf1de"; x.fillRect(0, 0, 1024, 300);
  x.fillStyle = "#e2a425"; x.fillRect(0, 0, 1024, 16); x.fillRect(0, 284, 1024, 16);
  x.fillStyle = accent; x.fillRect(0, 22, 1024, 6); x.fillRect(0, 272, 1024, 6);
  x.textAlign = "center";
  x.fillStyle = "#7a1c1c";
  x.font = "800 92px 'Fraunces Variable', Georgia, serif";
  x.fillText("VSM", 512, 118);
  x.fillStyle = "#2a1210";
  x.font = "700 30px 'DM Sans Variable', sans-serif";
  x.fillText(title.toUpperCase().split("").join(String.fromCharCode(8202)), 512, 172);
  x.fillStyle = accent;
  x.font = "48px 'Tiro Telugu', serif";
  x.fillText(telugu, 512, 238);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(60,15,10,0.55)");
  g.addColorStop(0.6, "rgba(60,15,10,0.18)");
  g.addColorStop(1, "rgba(60,15,10,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
