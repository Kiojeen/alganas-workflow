import { useState } from "react";
import { useModels } from "@/features/workflow/context";
import { PROVIDERS } from "@/features/workflow/lib/provider-models";
import { Key01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function AppSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { keys, setKey } = useModels();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>الإعدادات</DialogTitle>
          <DialogDescription>
            مفاتيح OpenAI وGoogle AI. لا يمكن إعادة تسمية الحقول أو إضافة مزودين.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">مفاتيح واجهة البرمجة</Label>
          <div className="space-y-2">
            {PROVIDERS.map((provider) => (
              <div key={provider.id} className="flex items-center gap-2">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <HugeiconsIcon
                    icon={Key01Icon}
                    className="text-muted-foreground size-4"
                  />
                </div>
                <div className="w-28 shrink-0 text-sm font-medium">
                  {provider.label}
                </div>
                <div className="relative flex-1">
                  <Input
                    type={revealed[provider.id] ? "text" : "password"}
                    placeholder="مفتاح API"
                    value={keys[provider.id]}
                    onChange={(e) => setKey(provider.id, e.target.value)}
                    className="pr-8"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((prev) => ({
                        ...prev,
                        [provider.id]: !prev[provider.id],
                      }))
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    <HugeiconsIcon
                      icon={revealed[provider.id] ? ViewOffIcon : ViewIcon}
                      className="size-4"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AppSettingsDialog };
