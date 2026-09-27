import { useEffect, useState } from "react";

import { extractPalette, loadCoverImage } from "./cover-layout";

export function useCoverImage(sourceImage: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [palette, setPalette] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!sourceImage) {
      setImage(null);
      setPalette([]);
      return;
    }
    loadCoverImage(sourceImage)
      .then((loaded) => {
        if (cancelled) return;
        setImage(loaded);
        setPalette(extractPalette(loaded));
      })
      .catch(() => {
        if (cancelled) return;
        setImage(null);
        setPalette([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceImage]);

  return { image, palette };
}
