import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";
import type { TutorialCatalogItem } from "@/data/bkf/tutorial-catalog";
import { parseYoutubeInput } from "@/lib/bkf/youtube-url";

export const TUTORIAL_VIDEOS_COLLECTION = "tutorial_videos";

export type TutorialVideoLink = {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  published: boolean;
  updatedAt: string;
  updatedByEmail: string;
};

function tsToIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function parseRow(id: string, data: Record<string, unknown>): TutorialVideoLink {
  return {
    id,
    youtubeUrl:
      typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : "",
    youtubeId: typeof data.youtubeId === "string" ? data.youtubeId.trim() : "",
    published: data.published === true,
    updatedAt: tsToIso(data.updatedAt),
    updatedByEmail:
      typeof data.updatedByEmail === "string" ? data.updatedByEmail : "",
  };
}

export async function loadTutorialVideoLinks(): Promise<
  Record<string, TutorialVideoLink>
> {
  const snap = await getDocs(
    collection(getAngelsCareDb(), TUTORIAL_VIDEOS_COLLECTION),
  );
  const map: Record<string, TutorialVideoLink> = {};
  for (const row of snap.docs) {
    map[row.id] = parseRow(row.id, row.data() as Record<string, unknown>);
  }
  return map;
}

export type SaveTutorialVideoInput = {
  item: TutorialCatalogItem;
  youtubeUrl: string;
  published: boolean;
};

export async function saveTutorialVideoLink(
  input: SaveTutorialVideoInput,
): Promise<TutorialVideoLink> {
  const parsed = parseYoutubeInput(input.youtubeUrl);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  const published = parsed.id ? input.published : false;
  const email = getAngelsCareAuth().currentUser?.email?.trim() || "";
  const ref = doc(
    getAngelsCareDb(),
    TUTORIAL_VIDEOS_COLLECTION,
    input.item.id,
  );

  await setDoc(
    ref,
    {
      youtubeUrl: parsed.url,
      youtubeId: parsed.id,
      published,
      title: input.item.title,
      profile: input.item.profile,
      module: input.item.module,
      file: input.item.file,
      updatedAt: serverTimestamp(),
      updatedByEmail: email,
    },
    { merge: true },
  );

  return {
    id: input.item.id,
    youtubeUrl: parsed.url,
    youtubeId: parsed.id,
    published,
    updatedAt: new Date().toISOString(),
    updatedByEmail: email,
  };
}
