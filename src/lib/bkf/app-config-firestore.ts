import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getAngelsCareAuth, getAngelsCareDb } from "@/lib/firebase/angels-care";

const COLLECTION = "app_config";
const DOC_ID = "mobile";

export const DEFAULT_ANDROID_PACKAGE = "br.com.angelscare.app";
export const DEFAULT_FORCE_MESSAGE =
  "Há uma nova versão obrigatória do Angel's Care. Atualize o aplicativo na Google Play para continuar.";

export function playStoreUrlFor(packageId: string): string {
  const id = packageId.trim() || DEFAULT_ANDROID_PACKAGE;
  return `https://play.google.com/store/apps/details?id=${id}`;
}

export type MobileAppConfig = {
  minBuildNumber: number;
  message: string;
  androidPackageId: string;
  playStoreUrl: string;
  updatedAt: string;
  updatedByEmail: string;
  exists: boolean;
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

export async function loadMobileAppConfig(): Promise<MobileAppConfig> {
  const snap = await getDoc(doc(getAngelsCareDb(), COLLECTION, DOC_ID));
  if (!snap.exists()) {
    return {
      minBuildNumber: 0,
      message: DEFAULT_FORCE_MESSAGE,
      androidPackageId: DEFAULT_ANDROID_PACKAGE,
      playStoreUrl: playStoreUrlFor(DEFAULT_ANDROID_PACKAGE),
      updatedAt: "",
      updatedByEmail: "",
      exists: false,
    };
  }
  const data = snap.data() as Record<string, unknown>;
  const packageId =
    typeof data.androidPackageId === "string" && data.androidPackageId.trim()
      ? data.androidPackageId.trim()
      : DEFAULT_ANDROID_PACKAGE;
  const minRaw = data.minBuildNumber;
  const min =
    typeof minRaw === "number"
      ? Math.max(0, Math.floor(minRaw))
      : Math.max(0, parseInt(String(minRaw ?? "0"), 10) || 0);

  return {
    minBuildNumber: min,
    message:
      typeof data.message === "string" && data.message.trim()
        ? data.message.trim()
        : DEFAULT_FORCE_MESSAGE,
    androidPackageId: packageId,
    playStoreUrl:
      typeof data.playStoreUrl === "string" && data.playStoreUrl.trim()
        ? data.playStoreUrl.trim()
        : playStoreUrlFor(packageId),
    updatedAt: tsToIso(data.updatedAt) || tsToIso(data.seededAt),
    updatedByEmail:
      typeof data.updatedByEmail === "string" ? data.updatedByEmail : "",
    exists: true,
  };
}

export type SaveMobileAppConfigInput = {
  minBuildNumber: number;
  message: string;
  androidPackageId?: string;
  playStoreUrl?: string;
};

export async function saveMobileAppConfig(
  input: SaveMobileAppConfigInput,
): Promise<MobileAppConfig> {
  const email = getAngelsCareAuth().currentUser?.email?.trim() || "";
  const packageId =
    (input.androidPackageId || DEFAULT_ANDROID_PACKAGE).trim() ||
    DEFAULT_ANDROID_PACKAGE;
  const message =
    input.message.trim() || DEFAULT_FORCE_MESSAGE;
  const minBuildNumber = Math.max(0, Math.floor(input.minBuildNumber) || 0);
  const playStoreUrl =
    (input.playStoreUrl || "").trim() || playStoreUrlFor(packageId);

  const ref = doc(getAngelsCareDb(), COLLECTION, DOC_ID);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      minBuildNumber,
      message,
      androidPackageId: packageId,
      playStoreUrl,
      seededAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByEmail: email,
    });
  } else {
    await updateDoc(ref, {
      minBuildNumber,
      message,
      androidPackageId: packageId,
      playStoreUrl,
      updatedAt: serverTimestamp(),
      updatedByEmail: email,
    });
  }

  return loadMobileAppConfig();
}
