import { Badge } from "@/components/ui/badge";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Spinner } from "@/components/ui/spinner";
import { Maximize04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

function ImagePreview({
  url,
  name,
  busy,
}: {
  url: string;
  name: string;
  busy: boolean;
}) {
  return (
    <div className="bg-muted relative overflow-hidden rounded-md border">
      {!busy && (
        <Badge
          variant="outline"
          className="absolute inset-s-2 top-2 z-50 [&>svg]:size-3!"
        >
          <HugeiconsIcon icon={Maximize04Icon} />
        </Badge>
      )}

      <ImageZoom>
        <img src={url} alt={name} className="max-h-64 w-full object-contain" />
      </ImageZoom>
      {busy && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}

export { ImagePreview };
