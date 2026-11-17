"use client";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  makeBowl, makeChicken, makeChilli, makeGarlic, makeJar, makeLabelTexture, makeLaddu, makeMango, makeShadowTexture, rng,
} from "./geometries";
import { MODEL_URLS, type PieceKind } from "./models";

/* ------------------------------------------------------------------ */
/* Scroll timeline (0 → 1 across the pinned section)                   */
/* ------------------------------------------------------------------ */
export const TL = {
  s1: [0.04, 0.29], lid1: [0.28, 0.34], move1: [0.35, 0.43],
  s2: [0.44, 0.62], lid2: [0.61, 0.66], move2: [0.66, 0.72],
  s3: [0.72, 0.87], final: [0.88, 0.96],
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const win = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Layout = { portrait: boolean };
type V3 = [number, number, number];
type Pose = { pos: V3; s: number };

function layoutPoses(l: Layout) {
  const P = l.portrait;
  const stage: Pose = P ? { pos: [0, -2.35, 0], s: 0.92 } : { pos: [1.7, -1.45, 0], s: 1.22 };
  return {
    stage,
    bowlStage: P ? { pos: [0, -2.0, 0], s: 0.95 } as Pose : { pos: [1.7, -1.25, 0], s: 1.25 } as Pose,
    offRight: { pos: [P ? 6 : 10, stage.pos[1], 0], s: stage.s } as Pose,
    done1: P ? { pos: [-1.2, -0.55, -3.2], s: 0.62 } as Pose : { pos: [0.3, -0.75, -4.6], s: 0.95 } as Pose,
    done2: P ? { pos: [1.2, -0.55, -3.2], s: 0.62 } as Pose : { pos: [4.9, -0.75, -4.6], s: 0.95 } as Pose,
    finalL: P ? { pos: [-1.12, -1.25, 0], s: 0.52 } as Pose : { pos: [-2.9, -1.55, 0], s: 1.0 } as Pose,
    finalM: P ? { pos: [0, -1.0, 0.6], s: 0.52 } as Pose : { pos: [0, -1.25, 0.4], s: 0.95 } as Pose,
    finalR: P ? { pos: [1.12, -1.25, 0], s: 0.52 } as Pose : { pos: [2.9, -1.55, 0], s: 1.0 } as Pose,
  };
}

function mixPose(a: Pose, b: Pose, t: number): Pose {
  const k = smooth(clamp01(t));
  return { pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k, a.pos[2] + (b.pos[2] - a.pos[2]) * k], s: a.s + (b.s - a.s) * k };
}

/* ------------------------------------------------------------------ */
/* Falling pieces                                                       */
/* ------------------------------------------------------------------ */
type Slot = { kind: PieceKind; start: THREE.Vector3; end: THREE.Vector3; t0: number; rot: THREE.Euler; spin: THREE.Vector3; scale: number; phase: number };

function buildSlots(stage: [number, number], n: number, kindAt: (k: number) => PieceKind, vessel: "jar" | "bowl", seed: number, high = false) {
  const r = rng(seed);
  const dur = 0.07;
  const slots: Slot[] = [];
  for (let k = 0; k < n; k++) {
    let end: THREE.Vector3;
    if (vessel === "jar") {
      const per = 7, layer = Math.floor(k / per), j = k % per;
      const ang = (j / per) * Math.PI * 2 + layer * 0.9 + r() * 0.3;
      const rad = j === 0 ? 0.08 + r() * 0.1 : 0.42 + r() * 0.16;
      end = new THREE.Vector3(Math.cos(ang) * rad, 0.2 + layer * 0.185 + r() * 0.05, Math.sin(ang) * rad);
    } else {
      const rings = [
        { n: 8, r: 0.72, y: 0.4 }, { n: 1, r: 0, y: 0.4 }, { n: 6, r: 0.45, y: 0.72 }, { n: 1, r: 0, y: 0.75 },
        { n: 4, r: 0.24, y: 1.02 }, { n: 1, r: 0, y: 1.3 },
      ];
      let idx = k, ring = rings[0];
      for (const rg of rings) { if (idx < rg.n) { ring = rg; break; } idx -= rg.n; }
      const ang = (idx / ring.n) * Math.PI * 2 + ring.y;
      end = new THREE.Vector3(Math.cos(ang) * ring.r, ring.y, Math.sin(ang) * ring.r);
    }
    const start = new THREE.Vector3((r() - 0.5) * (high ? 2.6 : 3.4), (high ? 6.6 : 2.7) + r() * 2.2, (r() - 0.5) * 1.6);
    slots.push({
      kind: kindAt(k), start, end,
      t0: stage[0] + (k / Math.max(1, n - 1)) * (stage[1] - stage[0] - dur),
      rot: new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28),
      spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(9),
      scale: 0.85 + r() * 0.3, phase: r() * 10,
    });
  }
  return slots;
}

const DUR = 0.07;
const tmpObj = new THREE.Object3D();

function placeSlot(s: Slot, p: number, time: number, idle: boolean) {
  const u = clamp01((p - s.t0) / DUR);
  const h = easeOutCubic(clamp01(u / 0.4));
  let yN: number;
  if (u < 0.7) yN = Math.pow(u / 0.7, 2);
  else yN = 1 - 0.07 * Math.sin((Math.PI * (u - 0.7)) / 0.3);
  tmpObj.position.set(
    s.start.x + (s.end.x - s.start.x) * h,
    s.start.y + (s.end.y - s.start.y) * yN,
    s.start.z + (s.end.z - s.start.z) * h,
  );
  const spinK = 1 - u;
  tmpObj.rotation.set(s.rot.x + s.spin.x * spinK, s.rot.y + s.spin.y * spinK, s.rot.z + s.spin.z * spinK);
  if (u === 0 && idle) {
    tmpObj.position.y += Math.sin(time * 1.3 + s.phase) * 0.07;
    tmpObj.rotation.x += time * 0.4;
    tmpObj.rotation.y += time * 0.3;
  }
  tmpObj.scale.setScalar(s.scale);
  tmpObj.updateMatrix();
  return u;
}

function useNormalizedGLTF(url: string, size: number) {
  const gltf = useGLTF(url, false);
  return useMemo(() => {
    let mesh: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => { if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh; });
    if (!mesh) return null;
    const m = mesh as THREE.Mesh;
    const g = m.geometry.clone();
    g.center();
    g.computeBoundingSphere();
    const s = size / (g.boundingSphere?.radius || 1);
    g.scale(s, s, s);
    return { geometry: g, material: m.material as THREE.Material };
  }, [gltf, size]);
}

function InstancedPieces({ slots, geometry, material, progress, idle }: {
  slots: Slot[]; geometry: THREE.BufferGeometry; material: THREE.Material; progress: RefObject<number>; idle: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current; if (!m) return;
    const c = new THREE.Color();
    const r = rng(slots.length * 31 + 7);
    slots.forEach((_, i) => { c.setHSL(0, 0, 0.82 + r() * 0.3); m.setColorAt(i, c); });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [slots]);
  useFrame((st) => {
    const m = ref.current; if (!m) return;
    const p = progress.current ?? 0;
    for (let i = 0; i < slots.length; i++) {
      placeSlot(slots[i], p, st.clock.elapsedTime, idle);
      m.setMatrixAt(i, tmpObj.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geometry, material, slots.length]} castShadow frustumCulled={false} />;
}

function GLTFPieces(props: { url: string; size: number; slots: Slot[]; progress: RefObject<number>; idle: boolean }) {
  const d = useNormalizedGLTF(props.url, props.size);
  if (!d) return null;
  return <InstancedPieces slots={props.slots} geometry={d.geometry} material={d.material} progress={props.progress} idle={props.idle} />;
}

function PieceSet({ slots, progress, idle }: { slots: Slot[]; progress: RefObject<number>; idle: boolean }) {
  const res = useMemo(() => {
    const oily = (rough: number, cc: number) => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: rough, clearcoat: cc, clearcoatRoughness: 0.25 });
    return {
      chicken: { geo: makeChicken(), mat: oily(0.5, 0.7), size: 0.2 },
      mango: { geo: makeMango(), mat: oily(0.45, 0.8), size: 0.18 },
      laddu: { geo: makeLaddu(), mat: oily(0.78, 0.12), size: 0.2 },
      chilli: { geo: makeChilli(), mat: oily(0.28, 1), size: 0.17 },
      garlic: { geo: makeGarlic(), mat: oily(0.5, 0.4), size: 0.08 },
    } satisfies Record<PieceKind, { geo: THREE.BufferGeometry; mat: THREE.Material; size: number }>;
  }, []);
  const groups = useMemo(() => {
    const g: Partial<Record<PieceKind, Slot[]>> = {};
    for (const s of slots) (g[s.kind] ||= []).push(s);
    return Object.entries(g) as [PieceKind, Slot[]][];
  }, [slots]);
  return (
    <>
      {groups.map(([kind, ss]) => {
        const url = (MODEL_URLS as Record<string, string>)[kind];
        if (url) return <Suspense key={kind} fallback={null}><GLTFPieces url={url} size={res[kind].size} slots={ss} progress={progress} idle={idle} /></Suspense>;
        return <InstancedPieces key={kind} slots={ss} geometry={res[kind].geo} material={res[kind].mat} progress={progress} idle={idle} />;
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Vessels                                                              */
/* ------------------------------------------------------------------ */
function GlassMaterial({ hq }: { hq: boolean }) {
  return hq ? (
    <meshPhysicalMaterial transmission={1} thickness={0.35} roughness={0.04} ior={1.45} clearcoat={1} clearcoatRoughness={0.05}
      attenuationColor="#fff6e6" attenuationDistance={4} side={THREE.DoubleSide} envMapIntensity={1.2} />
  ) : (
    <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.05} metalness={0} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} envMapIntensity={1.4} />
  );
}

type VesselProps = {
  type: "jar" | "bowl"; poseAt: (p: number) => Pose; slots: Slot[]; stage: readonly [number, number];
  lid?: readonly [number, number]; fillColor?: string; label?: { title: string; telugu: string; accent: string };
  progress: RefObject<number>; hq: boolean; idle: boolean; shadow: THREE.Texture; fontsReady: boolean; lidFrom: V3;
};

function Vessel({ type, poseAt, slots, stage, lid, fillColor, label, progress, hq, idle, shadow, fontsReady, lidFrom }: VesselProps) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);
  const jarGeo = useMemo(() => (type === "jar" ? makeJar() : makeBowl()), [type]);
  const labelTex = useMemo(() => (label && fontsReady !== undefined ? makeLabelTexture(label.title, label.telugu, label.accent) : null), [label, fontsReady]);
  useEffect(() => () => labelTex?.dispose(), [labelTex]);

  useFrame((st) => {
    const p = progress.current ?? 0;
    const t = st.clock.elapsedTime;
    const pose = poseAt(p);
    if (group.current) {
      group.current.position.set(...pose.pos);
      group.current.scale.setScalar(pose.s);
      group.current.visible = pose.pos[0] < 9.5;
    }
    if (spin.current) spin.current.rotation.y = idle ? Math.sin(t * 0.45) * 0.16 : 0;
    if (lidRef.current && lid) {
      const k = smooth(win(p, lid));
      const bob = idle ? Math.sin(t * 1.4) * 0.06 * (1 - k) : 0;
      lidRef.current.position.set(lidFrom[0] * (1 - k), 2.2 + (lidFrom[1] - 2.2) * (1 - k) + bob, lidFrom[2] * (1 - k));
      lidRef.current.rotation.y = (1 - k) * 1.8;
      lidRef.current.rotation.z = (1 - k) * 0.35;
    }
    if (fillRef.current) {
      const f = win(p, stage);
      const h = 0.04 + f * 1.08;
      fillRef.current.scale.y = h;
      fillRef.current.position.y = 0.03 + h / 2;
    }
  });

  return (
    <group ref={group}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.005} renderOrder={-1}>
        <planeGeometry args={type === "jar" ? [2.8, 2.8] : [3.6, 3.6]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <group ref={spin}>
        <PieceSet slots={slots} progress={progress} idle={idle} />
        {type === "jar" ? (
          <>
            {fillColor && (
              <mesh ref={fillRef}>
                <cylinderGeometry args={[0.86, 0.84, 1, 48]} />
                <meshPhysicalMaterial color={fillColor} roughness={0.25} clearcoat={0.9} clearcoatRoughness={0.15} />
              </mesh>
            )}
            <mesh geometry={jarGeo}><GlassMaterial hq={hq} /></mesh>
            {labelTex && (
              <mesh position-y={0.62}>
                <cylinderGeometry args={[0.935, 0.935, 0.62, 64, 1, true, -1.05, 2.1]} />
                <meshStandardMaterial map={labelTex} roughness={0.7} side={THREE.FrontSide} />
              </mesh>
            )}
            {lid && (
              <group ref={lidRef} position={lidFrom}>
                <mesh><cylinderGeometry args={[0.86, 0.86, 0.26, 64]} /><meshPhysicalMaterial color="#c0321f" roughness={0.35} clearcoat={1} /></mesh>
                <mesh position-y={0.135}><cylinderGeometry args={[0.8, 0.86, 0.02, 64]} /><meshPhysicalMaterial color="#a82a18" roughness={0.4} clearcoat={1} /></mesh>
                <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.87, 0.028, 12, 72]} /><meshStandardMaterial color="#e2a425" metalness={0.85} roughness={0.25} /></mesh>
              </group>
            )}
          </>
        ) : (
          <mesh geometry={jarGeo} castShadow>
            <meshStandardMaterial color="#d79a2b" metalness={0.92} roughness={0.28} side={THREE.DoubleSide} envMapIntensity={1.4} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */
function Rig({ idle }: { idle: boolean }) {
  const { camera, pointer, size } = useThree();
  const portrait = size.width / size.height < 0.9;
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-3 * dt);
    const tx = idle && !portrait ? pointer.x * 0.35 : 0;
    const ty = 0.9 + (idle && !portrait ? pointer.y * 0.2 : 0);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z = portrait ? 11.5 : 10;
    camera.lookAt(0, -0.3, 0);
  });
  return null;
}

function Smoother({ target, out }: { target: RefObject<number>; out: RefObject<number> }) {
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-7 * Math.min(dt, 0.1));
    out.current = (out.current ?? 0) + ((target.current ?? 0) - (out.current ?? 0)) * k;
  });
  return null;
}

function World({ target, hq, idle }: { target: RefObject<number>; hq: boolean; idle: boolean }) {
  const progress = useRef(target.current ?? 0);
  const { size } = useThree();
  const portrait = size.width / size.height < 0.9;
  const poses = useMemo(() => layoutPoses({ portrait }), [portrait]);
  const shadow = useMemo(() => makeShadowTexture(), []);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => { document.fonts?.ready.then(() => setFontsReady(true)); }, []);

  const slots1 = useMemo(() => buildSlots([TL.s1[0], TL.s1[1]], 56, (k) => (k % 7 === 3 ? "chilli" : k % 9 === 5 ? "garlic" : "chicken"), "jar", 11, portrait), [portrait]);
  const slots2 = useMemo(() => buildSlots([TL.s2[0], TL.s2[1]], 56, (k) => (k % 6 === 2 ? "chilli" : k % 11 === 7 ? "garlic" : "mango"), "jar", 23, portrait), [portrait]);
  const slots3 = useMemo(() => buildSlots([TL.s3[0], TL.s3[1]], 21, () => "laddu", "bowl", 37, portrait), [portrait]);

  const pose1 = (p: number) => {
    if (p < TL.move1[0]) return poses.stage;
    if (p < TL.final[0]) return mixPose(poses.stage, poses.done1, win(p, TL.move1));
    return mixPose(poses.done1, poses.finalL, win(p, TL.final));
  };
  const pose2 = (p: number) => {
    if (p < TL.move2[0]) return mixPose(poses.offRight, poses.stage, win(p, TL.move1));
    if (p < TL.final[0]) return mixPose(poses.stage, poses.done2, win(p, TL.move2));
    return mixPose(poses.done2, poses.finalR, win(p, TL.final));
  };
  const off3: Pose = { pos: [poses.offRight.pos[0], poses.bowlStage.pos[1], 0], s: poses.bowlStage.s };
  const pose3 = (p: number) => {
    if (p < TL.final[0]) return mixPose(off3, poses.bowlStage, win(p, TL.move2));
    return mixPose(poses.bowlStage, poses.finalM, win(p, TL.final));
  };

  const common = { progress, hq, idle, shadow, fontsReady, lidFrom: (portrait ? [0, 7.5, 0] : [-1.45, 2.95, 0.3]) as V3 };
  return (
    <>
      <Smoother target={target} out={progress} />
      <Rig idle={idle} />
      <ambientLight intensity={0.55} color="#fff1dc" />
      <directionalLight position={[4, 7, 5]} intensity={2.2} color="#ffe2b8" />
      <directionalLight position={[-5, 3, -4]} intensity={1.1} color="#ffb47a" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 5, -6]} scale={[12, 5, 1]} color="#fff3dc" />
        <Lightformer intensity={1.6} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#ffd29a" />
        <Lightformer intensity={1.2} position={[6, 1, 1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={2.5} position={[2, 4, 5]} scale={2.5} color="#ffffff" />
      </Environment>
      <Vessel type="jar" poseAt={pose1} slots={slots1} stage={TL.s1} lid={TL.lid1} fillColor="#7a230f"
        label={{ title: "Chicken Pickle", telugu: "చికెన్ పచ్చడి", accent: "#c0321f" }} {...common} />
      <Vessel type="jar" poseAt={pose2} slots={slots2} stage={TL.s2} lid={TL.lid2} fillColor="#a3301a"
        label={{ title: "Avakaya Pickle", telugu: "ఆవకాయ", accent: "#2f6b3a" }} {...common} />
      <Vessel type="bowl" poseAt={pose3} slots={slots3} stage={TL.s3} {...common} />
    </>
  );
}

export default function JarScene({ progress, hq, idle, active }: { progress: RefObject<number>; hq: boolean; idle: boolean; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={hq ? [1, 2] : [1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 40, position: [0, 0.9, 10], near: 0.1, far: 60 }}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <World target={progress} hq={hq} idle={idle} />
      </Suspense>
    </Canvas>
  );
}
