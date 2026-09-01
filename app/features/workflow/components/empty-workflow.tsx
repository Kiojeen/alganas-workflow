import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyWorkflow({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No workflow selected</CardTitle>
          <CardDescription>
            Create a new workflow to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCreate} className="gap-1.5">
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            New workflow
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
