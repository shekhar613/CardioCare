"use client";

import dynamic from "next/dynamic";

const HeartExperience = dynamic(
  () => import("@/components/heart/HeartExperience").then((mod) => mod.HeartExperience),
  {
    ssr: false,
    loading: () => (
      <div className="boot">
        <p className="boot-kicker">CardioCare</p>
        <p>Preparing the heart…</p>
      </div>
    ),
  },
);

export default function Home() {
  return <HeartExperience />;
}
