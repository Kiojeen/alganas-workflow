export type CoverFontPair =
  | "montserrat"
  | "castoro"
  | "montserrat-arabic"
  | "markazi";

export type CoverFontCategory = "arabic" | "english";

export type CoverFontSpec = {
  id: CoverFontPair;
  category: CoverFontCategory;
  label: string;
  titleFile: string;
  descriptionFile: string;
  titleFamily: string;
  descriptionFamily: string;
  labelFamily: string;
  /** Spine book title. */
  titleWeight: number;
  /** Back-stripe description. */
  descriptionWeight: number;
  /** Front chapter label. */
  labelWeight: number;
  /** Chapter label uses the description face. */
  labelFromDescription: boolean;
  /** Same file, different weights. */
  variable: boolean;
};

function publicFile(path: string) {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}

export const COVER_FONT_CATEGORIES: {
  id: CoverFontCategory;
  label: string;
}[] = [
  { id: "arabic", label: "عربي" },
  { id: "english", label: "English" },
];

export const COVER_FONT_PAIRS: CoverFontSpec[] = [
  {
    id: "montserrat-arabic",
    category: "arabic",
    label: "مونتسيرات",
    titleFile: publicFile("/ARBFONTS-MONTSERRAT-ARABIC-SEMIBOLD.TTF"),
    descriptionFile: publicFile("/ARBFONTS-MONTSERRAT-ARABIC-REGULAR.TTF"),
    titleFamily: "CoverMontserratArabicTitle",
    descriptionFamily: "CoverMontserratArabicText",
    labelFamily: "CoverMontserratArabicText",
    titleWeight: 600,
    descriptionWeight: 400,
    labelWeight: 400,
    labelFromDescription: true,
    variable: false,
  },
  {
    id: "markazi",
    category: "arabic",
    label: "مركزي",
    titleFile: publicFile("/MarkaziText-VariableFont_wght.ttf"),
    descriptionFile: publicFile("/MarkaziText-VariableFont_wght.ttf"),
    titleFamily: "CoverMarkazi",
    descriptionFamily: "CoverMarkazi",
    labelFamily: "CoverMarkazi",
    titleWeight: 700,
    descriptionWeight: 400,
    labelWeight: 400,
    labelFromDescription: true,
    variable: true,
  },
  {
    id: "montserrat",
    category: "english",
    label: "Montserrat",
    titleFile: publicFile("/MONTSERRAT-BOLD.TTF"),
    descriptionFile: publicFile("/MONTSERRAT-REGULAR.TTF"),
    titleFamily: "CoverMontserratTitle",
    descriptionFamily: "CoverMontserratDescription",
    labelFamily: "CoverMontserratTitle",
    titleWeight: 600,
    descriptionWeight: 400,
    labelWeight: 700,
    labelFromDescription: false,
    variable: false,
  },
  {
    id: "castoro",
    category: "english",
    label: "Castoro",
    titleFile: publicFile("/CASTORO-REGULAR.TTF"),
    descriptionFile: publicFile("/CASTORO-ITALIC.TTF"),
    titleFamily: "CoverCastoroTitle",
    descriptionFamily: "CoverCastoroDescription",
    labelFamily: "CoverCastoroTitle",
    titleWeight: 600,
    descriptionWeight: 400,
    labelWeight: 700,
    labelFromDescription: false,
    variable: false,
  },
];

export const DEFAULT_FONT_PAIR: CoverFontPair = "montserrat";

let fontsReady: Promise<void> | null = null;

export function getCoverFontPair(id?: string | null) {
  return (
    COVER_FONT_PAIRS.find((pair) => pair.id === id) ??
    COVER_FONT_PAIRS.find((pair) => pair.id === DEFAULT_FONT_PAIR) ??
    COVER_FONT_PAIRS[0]
  );
}

export function ensureCoverFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(
      COVER_FONT_PAIRS.flatMap((pair) => facesFor(pair).map(loadFace)),
    ).then(() => undefined);
  }
  return fontsReady;
}

function facesFor(pair: CoverFontSpec) {
  if (pair.variable) {
    return [
      {
        family: pair.titleFamily,
        url: pair.titleFile,
        weight: `${pair.descriptionWeight} ${pair.titleWeight}`,
      },
    ];
  }
  const faces = [
    {
      family: pair.titleFamily,
      url: pair.titleFile,
      weight:
        pair.labelFamily === pair.titleFamily &&
        pair.labelWeight !== pair.titleWeight
          ? `${Math.min(pair.titleWeight, pair.labelWeight)} ${Math.max(pair.titleWeight, pair.labelWeight)}`
          : String(pair.titleWeight),
    },
    {
      family: pair.descriptionFamily,
      url: pair.descriptionFile,
      weight: String(pair.descriptionWeight),
    },
  ];
  return pair.titleFamily === pair.descriptionFamily ? [faces[0]] : faces;
}

async function loadFace(face: { family: string; url: string; weight: string }) {
  if (
    [...document.fonts].some(
      (font) => font.family === face.family && font.weight === face.weight,
    )
  ) {
    return;
  }
  const loaded = new FontFace(face.family, `url(${face.url})`, {
    weight: face.weight,
  });
  await loaded.load();
  document.fonts.add(loaded);
}

export async function fetchCoverFontBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`تعذّر تحميل الخط ${url}`);
  return response.arrayBuffer();
}
