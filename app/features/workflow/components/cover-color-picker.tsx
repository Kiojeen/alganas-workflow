import { useEffect, useRef, useState } from "react";
import { ColorPickerIcon, ContrastIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Color from "color";

import { cn } from "@/lib/utils";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function toHex(value: Parameters<typeof Color.rgb>[0]): string {
  if (Array.isArray(value)) {
    return Color.rgb(
      Number(value[0]),
      Number(value[1]),
      Number(value[2]),
    ).hex();
  }
  return Color.rgb(value).hex();
}

export function CoverColorPicker({
  label,
  value,
  fallback,
  onChange,
  disabled,
  swatches,
  special,
  onSelectSpecial,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  disabled: boolean;
  swatches?: string[];
  /** A computed swatch shown last, e.g. the ink that contrasts with what sits under the text. */
  special?: { hex: string; backdrop: string; label: string; active?: boolean };
  onSelectSpecial?: () => void;
}) {
  const specialOn = special?.active === true;
  const committed = value || fallback;
  const [local, setLocal] = useState(committed);
  const dragging = useRef(false);
  const frame = useRef(0);

  useEffect(() => {
    if (dragging.current) return;
    setLocal(committed);
  }, [committed]);

  const matchesSwatch = (swatches ?? []).some(
    (hex) => hex.toLowerCase() === local.toLowerCase(),
  );

  const commit = (hex: string) => {
    setLocal(hex);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (hex.toLowerCase() !== committed.toLowerCase()) onChange(hex);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {swatches?.map((hex) => (
          <button
            key={hex}
            type="button"
            disabled={disabled}
            title={hex}
            onClick={() => {
              dragging.current = false;
              setLocal(hex);
              onChange(hex);
            }}
            className={cn(
              "size-5 rounded-sm border shadow-xs transition-transform disabled:opacity-50",
              !specialOn && local.toLowerCase() === hex.toLowerCase()
                ? "ring-primary ring-2 ring-offset-1"
                : "hover:scale-105",
            )}
            style={{ backgroundColor: hex }}
          />
        ))}
        {special && (
          <button
            type="button"
            disabled={disabled}
            title={special.label}
            aria-label={special.label}
            onClick={() => {
              dragging.current = false;
              setLocal(special.hex);
              if (onSelectSpecial) onSelectSpecial();
              else onChange(special.hex);
            }}
            className={cn(
              "flex size-5 items-center justify-center rounded-sm border shadow-xs transition-transform disabled:opacity-50",
              specialOn || local.toLowerCase() === special.hex.toLowerCase()
                ? "ring-primary ring-2 ring-offset-1"
                : "hover:scale-105",
            )}
            style={{
              background: `linear-gradient(135deg, ${special.backdrop} 50%, ${special.hex} 50%)`,
            }}
          >
            <HugeiconsIcon
              icon={ContrastIcon}
              className="size-3 text-white drop-shadow-[0_0_1.5px_rgba(0,0,0,1)]"
              strokeWidth={2.5}
            />
          </button>
        )}
        <Popover
          onOpenChange={(open) => {
            if (!open) dragging.current = false;
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              title={local}
              aria-label={`اختيار ${label}`}
              className={cn(
                "flex size-5 items-center justify-center rounded-sm border border-dashed shadow-xs transition-transform disabled:opacity-50",
                !specialOn && !matchesSwatch
                  ? "ring-primary ring-2 ring-offset-1"
                  : "hover:scale-105",
              )}
              style={{ backgroundColor: local }}
            >
              <HugeiconsIcon
                icon={ColorPickerIcon}
                className="size-3 text-white drop-shadow-[0_0_1.5px_rgba(0,0,0,1)]"
                strokeWidth={2.5}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-64 gap-3"
            onPointerDown={() => {
              dragging.current = true;
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
          >
            <ColorPicker
              value={local}
              onChange={(rgb) => commit(toHex(rgb))}
              className="h-auto w-full gap-3"
            >
              <ColorPickerSelection className="h-28 rounded-md" />
              <ColorPickerHue />
              <div className="flex items-center gap-2">
                <ColorPickerEyeDropper />
                <ColorPickerFormat />
              </div>
            </ColorPicker>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
