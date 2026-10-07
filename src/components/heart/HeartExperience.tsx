"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { ANATOMY, anatomyFor } from "@/lib/anatomy";
import { heartClock, illustratedOutput, syncClock } from "@/lib/cardiac";
import { resetHeartCamera, Scene } from "@/components/heart/BeatingHeart";
import { EcgStrip } from "@/components/heart/EcgStrip";

const RATES = [
  { label: "Rest", bpm: 60 },
  { label: "Typical", bpm: 72 },
  { label: "Brisk", bpm: 110 },
  { label: "Effort", bpm: 150 },
];

const SECTIONS = ["Chambers", "Valves", "Papillary muscles"] as const;
const CAMERA = { position: [0.4, 0.16, 4.2] as [number, number, number] };

export function HeartExperience() {
  const [bpm, setBpm] = useState(72);
  const [paused, setPaused] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [explode, setExplode] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [spin, setSpin] = useState(false);
  const [sound, setSound] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    syncClock({ bpm, paused, explode, showLabels, selected, hovered, sound });
  }, [bpm, paused, explode, showLabels, selected, hovered, sound]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      } else if (event.key === "ArrowRight") {
        setBpm((value) => Math.min(180, value + 1));
      } else if (event.key === "ArrowLeft") {
        setBpm((value) => Math.max(40, value - 1));
      } else if (event.key === "l" || event.key === "L") {
        setShowLabels((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const focusId = hovered ?? selected;
  const focus = focusId ? anatomyFor(focusId) : null;
  const output = illustratedOutput(bpm);

  function resetView() {
    resetHeartCamera();
  }

  function toggleSound() {
    if (sound) {
      setSound(false);
      return;
    }
    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!heartClock.audio) heartClock.audio = new AudioContextCtor();
    void heartClock.audio.resume();
    setSound(true);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" data-live="pulse" aria-hidden="true">
            <HeartIcon />
          </span>
          <div>
            <p className="brand-kicker">CardioCare</p>
            <h1>Living human heart</h1>
          </div>
        </div>
        <div className="rate-readout">
          <span className="led" data-live="led" aria-hidden="true" />
          <div>
            <p className="rate-value">
              {bpm}
              <span> bpm</span>
            </p>
            <p className="rate-caption" data-live="phase">
              Ventricular filling
            </p>
          </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="panel panel-structures">
          <p className="panel-kicker">Structures</p>
          <h2>Select a part</h2>
          <div className="structure-scroll">
            {SECTIONS.map((section) => (
              <div key={section} className="structure-section">
                <h3>{section}</h3>
                {ANATOMY.filter((entry) => entry.section === section).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={focusId === entry.id ? "part-button is-active" : "part-button"}
                    onClick={() => setSelected(entry.id)}
                    onMouseEnter={() => setHovered(entry.id)}
                    onMouseLeave={() => setHovered((current) => (current === entry.id ? null : current))}
                  >
                    <span className="swatch" style={{ background: entry.color }} />
                    <span>{entry.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="stage-viewport">
          <Canvas
            camera={{ position: CAMERA.position, fov: 34, near: 0.1, far: 40 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: false,
              toneMapping: ACESFilmicToneMapping,
              preserveDrawingBuffer: true,
            }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            onPointerMissed={() => setSelected(null)}
          >
            <Scene
              spin={spin && !paused && explode < 0.08}
              showLabels={showLabels}
              selected={selected}
              hovered={hovered}
              onSelect={setSelected}
              onHover={setHovered}
            />
          </Canvas>
          <div className="hud">
            <p data-live="phase">Ventricular filling</p>
            <span>Drag to orbit · scroll to zoom</span>
          </div>
        </div>

        <aside className="panel panel-detail">
          <p className="panel-kicker">{focus ? focus.section : "Cardiac cycle"}</p>
          <h2>{focus ? focus.title : "Four chambers, one beat"}</h2>
          <p className="detail-copy">
            {focus
              ? focus.summary
              : "The atria contract first and top up the ventricles. The ventricles then eject, and the valves open and close with that sequence."}
          </p>

          <dl className="stats">
            <div>
              <dt>Cycle</dt>
              <dd>{Math.round(60000 / bpm)} ms</dd>
            </div>
            <div>
              <dt>Beats here</dt>
              <dd data-live="beats">0</dd>
            </div>
            <div>
              <dt>Illustrated output</dt>
              <dd>{output.toFixed(1)} L/min</dd>
            </div>
          </dl>
          <p className="fine-print">Output uses a typical adult stroke volume of 70 ml. It is not measured from the model.</p>

          <label className="slider">
            <span>Heart rate</span>
            <input
              type="range"
              min={40}
              max={180}
              value={bpm}
              aria-valuemin={40}
              aria-valuemax={180}
              aria-valuenow={bpm}
              onChange={(event) => setBpm(Number(event.target.value))}
            />
          </label>
          <div className="presets">
            {RATES.map((rate) => (
              <button
                key={rate.label}
                type="button"
                className={bpm === rate.bpm ? "chip is-active" : "chip"}
                onClick={() => setBpm(rate.bpm)}
              >
                {rate.label}
                <span>{rate.bpm}</span>
              </button>
            ))}
          </div>

          <label className="slider">
            <span>Separate parts</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(explode * 100)}
              onChange={(event) => setExplode(Number(event.target.value) / 100)}
            />
          </label>

          <div className="toggles">
            <button type="button" className="chip" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button type="button" className={showLabels ? "chip is-active" : "chip"} onClick={() => setShowLabels((value) => !value)} aria-pressed={showLabels}>
              Labels
            </button>
            <button type="button" className={spin ? "chip is-active" : "chip"} onClick={() => setSpin((value) => !value)} aria-pressed={spin}>
              Spin
            </button>
            <button type="button" className={sound ? "chip is-active" : "chip"} onClick={toggleSound} aria-pressed={sound}>
              Sound
            </button>
            <button type="button" className="chip" onClick={resetView}>
              Reset view
            </button>
          </div>
          <p className="fine-print">Space pauses. Arrow keys change the rate. L toggles labels.</p>
        </aside>
      </div>

      <EcgStrip />

      <footer className="credits">
        <p>
          Geometry: female heart, Human Reference Atlas / HuBMAP CCF 3D Reference Object Library (Visible Human),{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
            CC BY 4.0
          </a>
          .{" "}
          <a href="https://humanatlas.io/" target="_blank" rel="noreferrer">
            humanatlas.io
          </a>
        </p>
        <p>Educational visualization. The beat is simplified and is not a clinical simulation.</p>
      </footer>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
      <path
        d="M16 27s-9.2-5.7-12.2-11.2C2 12.4 3.2 8 7.4 7.2 10.2 6.6 12.4 8 16 11.4 19.6 8 21.8 6.6 24.6 7.2 28.8 8 30 12.4 28.2 15.8 25.2 21.3 16 27 16 27z"
        fill="#ff5a73"
      />
    </svg>
  );
}
