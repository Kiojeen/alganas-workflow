import Color from "color";

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
  const current = value || fallback;

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
              onClick={() => onChange(hex)}
              className={cn(
                "size-7 rounded-md border shadow-xs transition-transform disabled:opacity-50",
                current.toLowerCase() === hex.toLowerCase()
                  ? "ring-primary ring-2 ring-offset-1"
                  : "hover:scale-105",
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="justify-start gap-2"
          >
            <span
              className="size-4 rounded-sm border"
              style={{ backgroundColor: current }}
            />
            <span className="font-mono text-xs">{current}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 gap-3">
          <ColorPicker
            value={current}
            onChange={(rgb) => onChange(toHex(rgb))}
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
