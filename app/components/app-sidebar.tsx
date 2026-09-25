import { useState } from "react";
import { useWorkflows, workflowTitle } from "@/features/workflow";
import {
  Cancel01Icon,
  PlusSignIcon,
  Settings02Icon,
  TrashIcon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import AppIcon from "./app-icon";
import { AppSettingsDialog } from "./app-settings-dialog";
import { Separator } from "./ui/separator";

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state } = useSidebar();
  const { workflows, currentId, select, add, remove } = useWorkflows();

  return (
    <>
      <Sidebar side="right" variant="sidebar" collapsible="icon" className="group-data-[side=right]:border-e">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-2!"
              >
                <div>
                  <AppIcon className="text-foreground size-6! transition-all ease-in-out group-data-[state=collapsed]:size-4!" />
                  <span className="text-base font-semibold">
                    أتمته الگناص
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
          </SidebarMenu>
          
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>المشاريع</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-6"
                onClick={add}
                aria-label="سير عمل جديد"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              </Button>
            </div>
            <SidebarMenu>
              {workflows.length === 0 ? (
                <p className="text-muted-foreground px-2 text-xs">
                لاتوجد مشاريع بعد.
                </p>
              ) : (
                workflows.map((wf) => {
                  const isActive = wf.id === currentId;
                  const title = workflowTitle(wf);
                  return (
                    <SidebarMenuItem
                      key={wf.id}
                      className={cn("group/workflow")}
                    >
                      <div
                        className={cn(
                          "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md",
                          isActive && "bg-sidebar-accent",
                        )}
                      >
                        <SidebarMenuButton
                          size="lg"
                          isActive={isActive}
                          tooltip={title}
                          onClick={() => select(wf.id)}
                          className="flex-1 group-data-[state=collapsed]:p-2!"

                          title={state === "expanded" ? title : undefined}
                        >
                          <HugeiconsIcon icon={WorkflowSquare01Icon} />
                          <span className="truncate group-data-[state=collapsed]:hidden">
                            {title}
                          </span>
                        </SidebarMenuButton>

                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(wf.id);
                          }}
                          className="text-muted-foreground hover:text-destructive group-data-[state=collapsed]:hidden"
                          aria-label={`حذف ${title}`}

                          title={`حذف ${title}`}
                        >
                          <HugeiconsIcon icon={TrashIcon} strokeWidth={2} />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <Separator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
                <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                <span>الإعدادات</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <AppSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
