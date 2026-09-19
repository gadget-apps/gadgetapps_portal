/** Aceita watch, youtu.be, embed e shorts; normaliza para youtube.com/watch?v=.
 *  Accepts watch, youtu.be, embed and shorts; normalizes to youtube.com/watch?v=. */
const YOUTUBE_ID_RE =
  /(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/;

export type YoutubeParseOk = { ok: true; url: string; id: string };
export type YoutubeParseEmpty = { ok: true; url: ""; id: "" };
export type YoutubeParseErr = { ok: false; error: string };
export type YoutubeParse = YoutubeParseOk | YoutubeParseEmpty | YoutubeParseErr;

export function parseYoutubeInput(raw: string): YoutubeParse {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, url: "", id: "" };
  const match = trimmed.match(YOUTUBE_ID_RE);
  if (!match?.[1]) {
    return {
      ok: false,
      error:
        "Cole um link do YouTube (youtube.com/watch, youtu.be, embed ou shorts).",
    };
  }
  return {
    ok: true,
    id: match[1],
    url: `https://www.youtube.com/watch?v=${match[1]}`,
  };
}

/** Embed do YouTube para conferir o vídeo no BKF (rascunho ou salvo).
 *  YouTube embed used to preview the video in BKF (draft or saved). */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const q = autoplay ? "?rel=0&autoplay=1" : "?rel=0";
  return `https://www.youtube.com/embed/${id}${q}`;
}
