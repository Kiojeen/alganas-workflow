import { HugeiconsIcon } from "@hugeicons/react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useModels } from "../context";
import {
  groupByProvider,
  modelsByKind,
  type ModelKind,
} from "../lib/provider-models";
import type { IconType } from "../types";

export function ModelSelect({
  kind,
  value,
  onChange,
  disabled,
  placeholder,
  label = "نموذج الذكاء الاصطناعي",
  icon,
  className,
}: {
  kind: ModelKind;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder: string;
  /** Pass `null` for a bare select, e.g. when an icon stands in for the label. */
  label?: string | null;
  icon?: IconType;
  className?: string;
}) {
  const { models, keys } = useModels();
  const options = modelsByKind(models, kind);
  const groups = groupByProvider(options);
  const selected = options.some((model) => model.id === value)
    ? value
    : (options[0]?.id ?? "");

  const select = (
    <Select
      value={selected || undefined}
      onValueChange={onChange}
      disabled={disabled || options.length === 0}
    >
      <SelectTrigger
        className={label === null ? (className ?? "w-full") : "w-full"}
        size="sm"
        aria-label={label ?? placeholder}
      >
        {icon && (
          <HugeiconsIcon
            icon={icon}
            className="text-muted-foreground size-3.5 shrink-0"
            strokeWidth={2}
          />
        )}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">
            أضف مفتاح API من الإعدادات
          </div>
        ) : (
          groups.map((group) => (
            <SelectGroup key={group.id}>
              <SelectLabel>
                {group.label}
                {!keys[group.id].trim() ? " — بلا مفتاح" : ""}
              </SelectLabel>
              {group.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );

  if (label === null) return select;

  return (
    <div className={className ?? "flex flex-col gap-1.5"}>
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {select}
    </div>
  );
}
