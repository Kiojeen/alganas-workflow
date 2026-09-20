import Color from "color";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

function toHex(value: Parameters<typeof Color.rgb>[0]): string {
  if (Array.isArray(value)) {
    return Color.rgb(Number(value[0]), Number(value[1]), Number(value[2])).hex();
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
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
  disabled: boolean;
  swatches?: string[];
}) {
  const committed = value || fallback;
  const [local, setLocal] = useState(committed);
  const dragging = useRef(false);
  const frame = useRef(0);

  useEffect(() => {
    if (dragging.current) return;
    setLocal(committed);
  }, [committed]);

  const commit = (hex: string) => {
    setLocal(hex);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (hex.toLowerCase() !== committed.toLowerCase()) onChange(hex);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">{label}</Label>
      {swatches && swatches.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((hex) => (
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
                "size-7 rounded-md border shadow-xs transition-transform disabled:opacity-50",
                local.toLowerCase() === hex.toLowerCase()
                  ? "ring-primary ring-2 ring-offset-1"
                  : "hover:scale-105",
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}
      <Popover
        onOpenChange={(open) => {
          if (!open) dragging.current = false;
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="justify-start gap-2"
          >
            <span
              className="size-4 rounded-sm border"
              style={{ backgroundColor: local }}
            />
            <span className="font-mono text-xs">{local}</span>
          </Button>
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
  );
}
