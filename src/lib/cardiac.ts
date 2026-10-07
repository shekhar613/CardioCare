export type Sim = {
  bpm: number;
  paused: boolean;
  explode: number;
  showLabels: boolean;
  selected: string | null;
  hovered: string | null;
  sound: boolean;
  phase: number;
  atrial: number;
  ventricular: number;
  phaseName: string;
  beats: number;
  audio: AudioContext | null;
};

export const heartClock: Sim = {
  bpm: 72,
  paused: false,
  explode: 0,
  showLabels: false,
  selected: null,
  hovered: null,
  sound: false,
  phase: 0,
  atrial: 0,
  ventricular: 0,
  phaseName: "Ventricular filling",
  beats: 0,
  audio: null,
};

export function syncClock(patch: Partial<Sim>) {
  Object.assign(heartClock, patch);
}

export function advanceClock(delta: number) {
  const step = Math.min(delta, 0.05);
  let lub = false;
  let dub = false;
  if (!heartClock.paused) {
    const previous = heartClock.phase;
    const next = (previous + (step * heartClock.bpm) / 60) % 1;
    if (next < previous) heartClock.beats += 1;
    if (heartClock.sound && heartClock.audio) {
      lub = crossed(previous, next, 0.2);
      dub = crossed(previous, next, 0.42);
    }
    heartClock.phase = next;
  }

  const pulse = contraction(heartClock.phase);
  heartClock.atrial = pulse.atrial;
  heartClock.ventricular = pulse.ventricular;
  heartClock.phaseName = phaseName(heartClock.phase);
  return { ...pulse, lub, dub };
}

/** Smooth bump on a looping 0–1 phase. Width is the standard deviation. */
function bell(phase: number, center: number, width: number) {
  let delta = phase - center;
  delta -= Math.round(delta);
  return Math.exp(-(delta * delta) / (2 * width * width));
}

export function contraction(phase: number) {
  const atrial = bell(phase, 0.1, 0.028);
  const ventricular = bell(phase, 0.3, 0.052);
  return { atrial, ventricular };
}

export function phaseName(phase: number) {
  if (phase < 0.16) return "Atrial systole";
  if (phase < 0.22) return "Isovolumetric contraction";
  if (phase < 0.4) return "Ventricular ejection";
  if (phase < 0.48) return "Isovolumetric relaxation";
  return "Ventricular filling";
}

/** Textbook ECG shape sampled across one cardiac cycle. */
export function ecgSample(phase: number) {
  const p = bell(phase, 0.09, 0.016) * 0.16;
  const q = bell(phase, 0.2, 0.007) * -0.14;
  const r = bell(phase, 0.218, 0.008) * 1;
  const s = bell(phase, 0.236, 0.007) * -0.24;
  const t = bell(phase, 0.4, 0.032) * 0.28;
  return p + q + r + s + t;
}

export function crossed(previous: number, next: number, mark: number) {
  if (next >= previous) return previous < mark && next >= mark;
  return previous < mark || next >= mark;
}

/** Illustrated cardiac output from a typical adult stroke volume of 70 ml. */
export function illustratedOutput(bpm: number) {
  return (bpm * 70) / 1000;
}
