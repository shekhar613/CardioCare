"use client";

import { useEffect, useRef } from "react";
import { ecgSample, heartClock } from "@/lib/cardiac";

export function EcgStrip() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const samples = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const maxSamples = Math.max(24, Math.floor(rect.width / 2));
      const state = heartClock;
      if (!state.paused) {
        samples.current.push(ecgSample(state.phase));
        if (samples.current.length > maxSamples) {
          samples.current.splice(0, samples.current.length - maxSamples);
        }
      }

      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(93, 255, 162, 0.09)";
      context.lineWidth = 1;
      const gap = 18 * dpr;
      context.beginPath();
      for (let x = gap; x < width; x += gap) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = gap; y < height; y += gap) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();

      const mid = height * 0.62;
      const amp = height * 0.36;
      context.beginPath();
      context.lineWidth = 1.7 * dpr;
      context.strokeStyle = "#67f5aa";
      context.shadowColor = "rgba(93, 255, 162, 0.55)";
      context.shadowBlur = 10;
      const trace = samples.current;
      for (let index = 0; index < trace.length; index += 1) {
        const x = (index / maxSamples) * width;
        const y = mid - trace[index] * amp;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.shadowBlur = 0;

      if (trace.length > 0) {
        const x = ((trace.length - 1) / maxSamples) * width;
        const y = mid - trace[trace.length - 1] * amp;
        context.fillStyle = "#eafff4";
        context.beginPath();
        context.arc(x, y, 2.4 * dpr, 0, Math.PI * 2);
        context.fill();
      }

      const phase = document.querySelectorAll<HTMLElement>("[data-live='phase']");
      phase.forEach((node) => {
        if (node.textContent !== state.phaseName) node.textContent = state.phaseName;
      });
      const beats = document.querySelectorAll<HTMLElement>("[data-live='beats']");
      const beatText = String(state.beats);
      beats.forEach((node) => {
        if (node.textContent !== beatText) node.textContent = beatText;
      });
      document.querySelectorAll<HTMLElement>("[data-live='pulse']").forEach((node) => {
        const scale = 1 - state.ventricular * 0.12 - state.atrial * 0.04;
        node.style.transform = `scale(${scale})`;
      });
      document.querySelectorAll<HTMLElement>("[data-live='led']").forEach((node) => {
        node.style.opacity = String(0.35 + state.ventricular * 0.65);
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="ecg">
      <div className="ecg-meta">
        <span>Lead II</span>
        <span>Simplified rhythm</span>
      </div>
      <canvas ref={canvasRef} className="ecg-canvas" aria-hidden="true" />
    </div>
  );
}
