import { useState } from "react";
import { useModels } from "@/features/workflow/context";
import {
  Delete02Icon,
  Key01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
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
  const { models, addModel, updateModel, removeModel } = useModels();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your workspace and AI model connections.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">AI model keys</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => addModel("", "")}
              className="h-7 gap-1 text-xs"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              Add model
            </Button>
          </div>

          <div className="space-y-2">
            {models.map((model) => (
              <div key={model.id} className="flex items-center gap-2">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <HugeiconsIcon
                    icon={Key01Icon}
                    className="text-muted-foreground size-4"
                  />
                </div>

                <Input
                  placeholder="Name (e.g. OpenAI)"
                  value={model.name}
                  onChange={(e) =>
                    updateModel(model.id, "name", e.target.value)
                  }
                  className="flex-1"
                />

                <div className="relative flex-1">
                  <Input
                    type={revealed[model.id] ? "text" : "password"}
                    placeholder="API key"
                    value={model.key}
                    onChange={(e) =>
                      updateModel(model.id, "key", e.target.value)
                    }
                    className="pr-8"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((prev) => ({
                        ...prev,
                        [model.id]: !prev[model.id],
                      }))
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    <HugeiconsIcon
                      icon={revealed[model.id] ? ViewOffIcon : ViewIcon}
                      className="size-4"
                    />
                  </button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                  onClick={() => removeModel(model.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AppSettingsDialog };
