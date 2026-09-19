const fs = require("fs");
const path = require("path");

const root = path.join(
  "c:",
  "GadgetApps",
  "Videos Tutoriais - Angel's Care",
);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.toLowerCase().endsWith(".webm") && !name.includes("_original")) {
      acc.push(full);
    }
  }
  return acc;
}

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 90);
}

function titleFromFile(name) {
  return name
    .replace(/\.webm$/i, "")
    .replace(/^\d+\s*-+\s*/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const files = walk(root);
const items = files.map((full) => {
  const rel = path.relative(root, full);
  const parts = rel.split(path.sep);
  const top = parts[0] || "";
  let profile = "Comum";
  if (top.includes("Contratante")) profile = "Contratante";
  else if (top.includes("Profissional")) profile = "Profissional";
  const module =
    parts.length > 2
      ? parts[1].replace(/^\d+\s*-+\s*/, "")
      : top.replace(/^\d+\s*-+\s*/, "");
  const file = parts[parts.length - 1];
  return {
    id: slug(rel.replace(/\.webm$/i, "")),
    profile,
    module,
    title: titleFromFile(file),
    file: rel.split(path.sep).join("/"),
  };
});

const ids = items.map((i) => i.id);
const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dups.length) {
  console.error("duplicate ids", dups);
  process.exit(1);
}

const outPath = path.join(
  "c:",
  "GadgetApps",
  "gadgetapps_portal",
  "src",
  "data",
  "bkf",
  "tutorial-catalog.ts",
);

const body = `export type TutorialProfile = "Comum" | "Contratante" | "Profissional";

export type TutorialCatalogItem = {
  id: string;
  profile: TutorialProfile;
  module: string;
  title: string;
  file: string;
};

/** Catálogo estático dos vídeos tutoriais (pasta local). Links do YouTube ficam no Firestore.
 *  Static catalog of tutorial videos (local folder). YouTube links live in Firestore. */
export const TUTORIAL_CATALOG: TutorialCatalogItem[] = ${JSON.stringify(items, null, 2)};

export const TUTORIAL_PROFILES: TutorialProfile[] = [
  "Comum",
  "Contratante",
  "Profissional",
];

export function tutorialModulesFor(profile: TutorialProfile | "todos"): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of TUTORIAL_CATALOG) {
    if (profile !== "todos" && item.profile !== profile) continue;
    if (seen.has(item.module)) continue;
    seen.add(item.module);
    list.push(item.module);
  }
  return list;
}
`;

fs.writeFileSync(outPath, body, "utf8");
console.log("wrote", items.length, "items to", outPath);
