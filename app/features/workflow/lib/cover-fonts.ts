export type CoverFontPair = "montserrat" | "castoro";

function publicFile(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}

export const COVER_FONT_PAIRS: {
  id: CoverFontPair;
  label: string;
  titleFile: string;
  descriptionFile: string;
  titleFamily: string;
  descriptionFamily: string;
}[] = [
  {
    id: "montserrat",
    label: "Montserrat",
    titleFile: publicFile("/MONTSERRAT-BOLD.TTF"),
    descriptionFile: publicFile("/MONTSERRAT-REGULAR.TTF"),
    titleFamily: "CoverMontserratTitle",
    descriptionFamily: "CoverMontserratDescription",
  },
  {
    id: "castoro",
    label: "Castoro",
    titleFile: publicFile("/CASTORO-REGULAR.TTF"),
    descriptionFile: publicFile("/CASTORO-ITALIC.TTF"),
    titleFamily: "CoverCastoroTitle",
    descriptionFamily: "CoverCastoroDescription",
  },
];

export const DEFAULT_FONT_PAIR: CoverFontPair = "montserrat";

let fontsReady: Promise<void> | null = null;

export function getCoverFontPair(id?: string | null) {
  return (
    COVER_FONT_PAIRS.find((pair) => pair.id === id) ?? COVER_FONT_PAIRS[0]
  );
}

export function ensureCoverFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(
      COVER_FONT_PAIRS.flatMap((pair) => [
        loadFace(pair.titleFamily, pair.titleFile),
        loadFace(pair.descriptionFamily, pair.descriptionFile),
      ]),
    ).then(() => undefined);
  }
  return fontsReady;
}

async function loadFace(family: string, url: string) {
  if ([...document.fonts].some((font) => font.family === family)) return;
  const face = new FontFace(family, `url(${url})`);
  await face.load();
  document.fonts.add(face);
}

export async function fetchCoverFontBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`تعذّر تحميل الخط ${url}`);
  return response.arrayBuffer();
}
