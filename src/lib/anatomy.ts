export type PartGroup =
  | "atrium"
  | "ventricle"
  | "septum"
  | "papillary"
  | "av-valve"
  | "semilunar";

export type AnatomyEntry = {
  id: string;
  title: string;
  section: "Chambers" | "Valves" | "Papillary muscles";
  order: number;
  group: PartGroup;
  color: string;
  sheen: string;
  summary: string;
  labeled: boolean;
};

export const ANATOMY: AnatomyEntry[] = [
  {
    id: "VH_F_right_cardiac_atrium",
    title: "Right atrium",
    section: "Chambers",
    order: 1,
    group: "atrium",
    color: "#c44758",
    sheen: "#ffd0d6",
    summary:
      "Receives blood returning from the body through the superior and inferior vena cava, then passes it through the tricuspid valve.",
    labeled: true,
  },
  {
    id: "VH_F_right_ventricle",
    title: "Right ventricle",
    section: "Chambers",
    order: 2,
    group: "ventricle",
    color: "#a61d32",
    sheen: "#ffc2cb",
    summary:
      "Pumps blood to the lungs. Its wall is thinner than the left ventricle because the lung circuit runs at lower pressure.",
    labeled: true,
  },
  {
    id: "VH_F_left_cardiac_atrium",
    title: "Left atrium",
    section: "Chambers",
    order: 3,
    group: "atrium",
    color: "#d15a68",
    sheen: "#ffe0e4",
    summary:
      "Receives oxygenated blood from the lungs through the pulmonary veins, then passes it through the mitral valve.",
    labeled: true,
  },
  {
    id: "VH_F_left_ventricle",
    title: "Left ventricle",
    section: "Chambers",
    order: 4,
    group: "ventricle",
    color: "#8e182b",
    sheen: "#ffb8c4",
    summary:
      "The thickest chamber. It ejects oxygenated blood through the aortic valve so it can circulate through the body.",
    labeled: true,
  },
  {
    id: "VH_F_interventricular_septum",
    title: "Interventricular septum",
    section: "Chambers",
    order: 5,
    group: "septum",
    color: "#6d1020",
    sheen: "#e8a0ac",
    summary:
      "The muscular wall between the ventricles. It contracts with them and keeps oxygenated and deoxygenated blood apart.",
    labeled: true,
  },
  {
    id: "VH_F_tricuspid_valve",
    title: "Tricuspid valve",
    section: "Valves",
    order: 6,
    group: "av-valve",
    color: "#f0c2b8",
    sheen: "#fff1ec",
    summary:
      "The right atrioventricular valve, named for three cusps. It closes when the right ventricle contracts so blood cannot return to the atrium.",
    labeled: true,
  },
  {
    id: "VH_F_pulmonary_valve",
    title: "Pulmonary valve",
    section: "Valves",
    order: 7,
    group: "semilunar",
    color: "#f3d5cc",
    sheen: "#fff6f2",
    summary:
      "Opens as the right ventricle ejects blood toward the lungs, then shuts as the ventricle relaxes.",
    labeled: true,
  },
  {
    id: "VH_F_mitral_valve",
    title: "Mitral valve",
    section: "Valves",
    order: 8,
    group: "av-valve",
    color: "#e7b5ac",
    sheen: "#fff0eb",
    summary:
      "The left atrioventricular valve, also called the bicuspid valve. It opens while the left ventricle fills and closes during ejection.",
    labeled: true,
  },
  {
    id: "VH_F_aortic_valve",
    title: "Aortic valve",
    section: "Valves",
    order: 9,
    group: "semilunar",
    color: "#f6ddd4",
    sheen: "#fff8f5",
    summary:
      "Opens when the left ventricle ejects, then closes so blood in the aorta does not fall back into the heart.",
    labeled: true,
  },
  {
    id: "VH_F_papillary_muscle_of_heart_ant",
    title: "Anterior papillary muscle",
    section: "Papillary muscles",
    order: 10,
    group: "papillary",
    color: "#b12a3e",
    sheen: "#ffc8d0",
    summary:
      "Anterior papillary muscle of the right ventricle. It tenses the chordae tendineae so the tricuspid valve stays sealed during systole.",
    labeled: false,
  },
  {
    id: "VH_F_papillary_muscle_of_heart_pos",
    title: "Posterior papillary muscle",
    section: "Papillary muscles",
    order: 11,
    group: "papillary",
    color: "#b12a3e",
    sheen: "#ffc8d0",
    summary:
      "Posterior papillary muscle of the right ventricle. It anchors chordae to the tricuspid valve.",
    labeled: false,
  },
  {
    id: "VH_F_papillary_muscle_of_heart_med",
    title: "Septal papillary muscle",
    section: "Papillary muscles",
    order: 12,
    group: "papillary",
    color: "#b12a3e",
    sheen: "#ffc8d0",
    summary:
      "Septal papillary muscle of the right ventricle, arising from the interventricular septum.",
    labeled: false,
  },
  {
    id: "VH_F_papillary_muscle_of_heart_antlat",
    title: "Anterolateral papillary muscle",
    section: "Papillary muscles",
    order: 13,
    group: "papillary",
    color: "#9a2034",
    sheen: "#ffc4cd",
    summary:
      "Anterolateral papillary muscle of the left ventricle. It supports the mitral valve during contraction.",
    labeled: false,
  },
  {
    id: "VH_F_papillary_muscle_of_heart_posmed",
    title: "Posteromedial papillary muscle",
    section: "Papillary muscles",
    order: 14,
    group: "papillary",
    color: "#9a2034",
    sheen: "#ffc4cd",
    summary:
      "Posteromedial papillary muscle of the left ventricle. It supports the mitral valve during contraction.",
    labeled: false,
  },
];

const BY_ID = new Map(ANATOMY.map((entry) => [entry.id, entry]));

export function anatomyFor(id: string): AnatomyEntry {
  return (
    BY_ID.get(id) ?? {
      id,
      title: id.replaceAll("_", " "),
      section: "Chambers",
      order: 99,
      group: "ventricle",
      color: "#a61d32",
      sheen: "#ffc2cb",
      summary: "Part of the heart reference model.",
      labeled: false,
    }
  );
}

export function muscleScale(group: PartGroup, atrial: number, ventricular: number) {
  if (group === "atrium") return 1 - 0.09 * atrial + 0.04 * ventricular;
  if (group === "ventricle" || group === "septum") return 1 - 0.11 * ventricular + 0.025 * atrial;
  if (group === "papillary") return 1 - 0.07 * ventricular;
  if (group === "av-valve") return 0.84 + 0.2 * (1 - Math.min(1, ventricular * 1.35));
  return 0.84 + 0.2 * Math.min(1, ventricular * 1.25);
}
