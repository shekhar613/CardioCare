"use client";

import { Component, Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { advanceClock, heartClock } from "@/lib/cardiac";
import { muscleScale } from "@/lib/anatomy";
import { prepareHeart, type HeartPart } from "@/lib/prepare-heart";

useGLTF.preload("/models/heart.glb");

const cameraRig: { controls: OrbitControlsImpl | null } = { controls: null };

type SceneProps = {
  spin: boolean;
  showLabels: boolean;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
};

function placeHeartCamera(camera: PerspectiveCamera, controls: OrbitControlsImpl | null) {
  const fit = 0.76;
  const tan = Math.tan((camera.fov * Math.PI) / 180 / 2);
  const distance = Math.max(1.15 / (tan * camera.aspect * fit), 0.82 / (tan * fit), 2.4);
  camera.position.set(distance * 0.1, distance * 0.04, distance);
  camera.updateProjectionMatrix();
  if (!controls) return;
  controls.target.set(0, 0.02, 0);
  controls.update();
}

export function resetHeartCamera() {
  const controls = cameraRig.controls;
  if (!controls) return;
  placeHeartCamera(controls.object as PerspectiveCamera, controls);
}

export function Scene({ spin, showLabels, selected, hovered, onSelect, onHover }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#090b10"]} />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#ffe6d5", "#1c2436", 0.5]} />
      <directionalLight position={[4.5, 6, 3.5]} intensity={2.6} color="#FFE6D5" />
      <directionalLight position={[-4.2, 1.6, -2.4]} intensity={0.45} color="#6C8CFF" />
      <QuietBoundary>
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.42} />
        </Suspense>
      </QuietBoundary>
      <Suspense fallback={null}>
        <BeatingHeart
          showLabels={showLabels}
          selected={selected}
          hovered={hovered}
          onSelect={onSelect}
          onHover={onHover}
        />
      </Suspense>
      <OrbitControls
        ref={(controls) => {
          cameraRig.controls = controls;
        }}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.6}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.86}
        autoRotate={spin}
        autoRotateSpeed={0.55}
        target={[0, 0.02, 0]}
      />
      <FrameHeart />
    </>
  );
}

function FrameHeart() {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || width < 2 || height < 2) return;
    placeHeartCamera(camera, cameraRig.controls);
  }, [camera, width, height]);

  return null;
}

function BeatingHeart({ showLabels, selected, hovered, onSelect, onHover }: Omit<SceneProps, "spin">) {
  const gltf = useGLTF("/models/heart.glb");
  const prepared = useMemo(() => prepareHeart(gltf.scene), [gltf.scene]);
  const group = useRef<Group>(null);

  useFrame(({ gl }, delta) => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.12;
    const pulse = advanceClock(delta);
    if (pulse.lub && heartClock.audio) thump(heartClock.audio, 78, 0.14, 0.2);
    if (pulse.dub && heartClock.audio) thump(heartClock.audio, 56, 0.1, 0.12);
    if (group.current) {
      group.current.rotation.y = pulse.ventricular * 0.14;
      group.current.position.y = -0.03 * pulse.ventricular;
    }
  });

  return (
    <>
      <group ref={group} scale={prepared.scale}>
        {prepared.parts.map((part) => (
          <HeartMesh
            key={part.id}
            part={part}
            showLabels={showLabels}
            selected={selected}
            hovered={hovered}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </group>
      <ContactShadows
        position={[0, prepared.floorY, 0]}
        opacity={0.45}
        scale={7}
        blur={2.4}
        far={2.4}
        color="#140208"
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, prepared.floorY + 0.01, 0]}>
        <ringGeometry args={[0.72, 0.9, 80]} />
        <meshBasicMaterial color="#ff5a73" transparent opacity={0.22} />
      </mesh>
    </>
  );
}

function HeartMesh({
  part,
  showLabels,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  part: HeartPart;
  showLabels: boolean;
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const mesh = useRef<Mesh>(null);
  const label = useRef<Group>(null);
  const material = useMemo(() => {
    const valve = part.entry.group === "av-valve" || part.entry.group === "semilunar";
    return new MeshPhysicalMaterial({
      color: new Color(part.entry.color),
      roughness: valve ? 0.25 : 0.45,
      metalness: 0.02,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      emissive: new Color("#FF5A6E"),
      emissiveIntensity: 0.04,
      transparent: valve,
      opacity: valve ? 0.85 : 1,
      depthWrite: true,
      side: DoubleSide,
    });
  }, [part.entry]);

  useFrame(() => {
    const current = mesh.current;
    if (!current) return;
    const scale = muscleScale(part.entry.group, heartClock.atrial, heartClock.ventricular);
    const shorten =
      part.entry.group === "ventricle" || part.entry.group === "septum"
        ? 1 - 0.05 * heartClock.ventricular
        : 1;
    current.scale.set(scale, scale * shorten, scale);

    const spread = part.center.clone().normalize();
    const reach = part.center.length();
    spread.multiplyScalar(heartClock.explode * (0.28 + reach * 0.85));
    current.position.copy(part.center).multiplyScalar(1 - scale).add(spread);
    if (label.current) label.current.position.copy(part.center).add(spread);

    const surface = current.material;
    if (!(surface instanceof MeshPhysicalMaterial)) return;
    const focus = heartClock.selected ?? heartClock.hovered;
    const active = focus === part.id;
    const valve = part.entry.group === "av-valve" || part.entry.group === "semilunar";
    if (valve) {
      surface.transparent = true;
      surface.opacity = 0.85;
      surface.depthWrite = true;
    }
    const beat =
      part.entry.group === "atrium" || part.entry.group === "av-valve"
        ? heartClock.atrial
        : heartClock.ventricular;
    surface.emissiveIntensity = (active ? 0.25 : 0.04) + beat * 0.06;
  });

  const focus = selected ?? hovered;
  const shown = (showLabels && part.entry.labeled) || focus === part.id;

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={part.geometry}
        material={material}
        frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(part.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(part.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "";
        }}
      />
      {shown ? (
        <group ref={label}>
          <Html position={[0, 0.025, 0]} center distanceFactor={2.7} zIndexRange={[30, 0]}>
            <div className="part-label">{part.entry.title}</div>
          </Html>
        </group>
      ) : null}
    </group>
  );
}

class QuietBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function thump(context: AudioContext, frequency: number, duration: number, gainValue: number) {
  if (context.state === "suspended") void context.resume();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * 0.45), context.currentTime + duration);
  filter.type = "lowpass";
  filter.frequency.value = 140;
  gain.gain.setValueAtTime(gainValue, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}
