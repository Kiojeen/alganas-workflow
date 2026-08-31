import { useState } from "react";
import {
  PlusSignIcon,
  Settings02Icon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
} from "@/components/ui/sidebar";

import AppIcon from "./app-icon";
import { AppSettingsDialog } from "./app-settings-dialog";

const workflows = [
  { id: "1", name: "Customer Onboarding" },
  { id: "2", name: "Invoice Approval" },
  { id: "3", name: "Lead Scoring" },
  { id: "4", name: "Content Review" },
  { id: "5", name: "Bug Triage" },
  { id: "6", name: "Employee Offboarding" },
];

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center justify-between">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-2!"
              >
                <a href="/">
                  <AppIcon className="bg-background size-6! text-black" />
                  <span className="text-base font-semibold">
                    Alganas Workflow
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between px-2">
              <SidebarGroupLabel>Workflows</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-6"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
              </Button>
            </div>
            <SidebarMenu>
              {workflows.map((wf) => (
                <SidebarMenuItem key={wf.id}>
                  <SidebarMenuButton tooltip={wf.name}>
                    <HugeiconsIcon
                      icon={WorkflowSquare01Icon}
                      className="size-4"
                    />
                    <span className="truncate">{wf.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSettingsOpen(true)}>
                <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                <span>Settings</span>
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
