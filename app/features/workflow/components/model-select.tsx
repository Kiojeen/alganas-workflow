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

export function ModelSelect({
  kind,
  value,
  onChange,
  disabled,
  placeholder,
  label = "نموذج الذكاء الاصطناعي",
}: {
  kind: ModelKind;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder: string;
  label?: string;
}) {
  const { models, keys } = useModels();
  const options = modelsByKind(models, kind);
  const groups = groupByProvider(options);
  const selected =
    options.some((model) => model.id === value) ? value : (options[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <Select
        value={selected || undefined}
        onValueChange={onChange}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger className="w-full">
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
    </div>
  );
}
