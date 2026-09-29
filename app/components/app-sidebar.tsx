import { useState } from "react";
import { useWorkflows, workflowTitle } from "@/features/workflow";
import { resolveChapters } from "@/features/workflow/lib/cover-layout";
import { useTheme } from "@/providers/theme-provider";
import {
  BookOpen01Icon,
  Delete02Icon,
  PlusSignIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { comboText, useShortcuts } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import AppIcon from "./app-icon";
import {
  AppSettingsDialog,
  type SettingsSectionId,
} from "./app-settings-dialog";

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSectionId>("ai");
  const { workflows, currentId, select, add, remove } = useWorkflows();
  const { setTheme } = useTheme();

  const openSettings = (section: SettingsSectionId = "ai") => {
    setSettingsSection(section);
    setSettingsOpen(true);
  };

  useShortcuts({
    settings: () => openSettings("ai"),
    shortcuts: () => openSettings("shortcuts"),
    "new-project": add,
    theme: () => {
      const dark = document.documentElement.classList.contains("dark");
      setTheme(dark ? "light" : "dark");
    },
  });

  return (
    <>
      <Sidebar
        side="right"
        variant="sidebar"
        collapsible="icon"
        className="group-data-[side=right]:border-e"
      >
        <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
          <div className="flex w-full items-center gap-2.5 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg">
              <AppIcon className="size-5!" />
            </div>
            <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">أتمته الگناص</p>
              <p className="text-sidebar-foreground/60 truncate text-[11px]">
                مكتب أغلفة الكتب
              </p>
            </div>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={add}
                tooltip={`مشروع جديد (${comboText("new-project")})`}
                className="border-sidebar-border bg-sidebar-accent/40 hover:bg-sidebar-accent justify-center border font-medium group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0"
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
                <span className="group-data-[collapsible=icon]:hidden">
                  مشروع جديد
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="justify-between">
              <span>المشاريع</span>
              <span className="bg-sidebar-accent text-sidebar-foreground/70 rounded-full px-1.5 text-[10px] tabular-nums">
                {workflows.length}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {workflows.length === 0 ? (
                  <p className="text-sidebar-foreground/60 px-2 py-3 text-xs group-data-[collapsible=icon]:hidden">
                    لا توجد مشاريع بعد. أنشئ مشروعًا للبدء.
                  </p>
                ) : (
                  workflows.map((wf) => {
                    const isActive = wf.id === currentId;
                    const title = workflowTitle(wf);
                    const { bookConfig, preview, outputImage } = wf.state;
                    const chapterCount = resolveChapters(bookConfig).length;
                    const hasCover = Boolean(outputImage ?? preview);
                    return (
                      <SidebarMenuItem key={wf.id}>
                        <SidebarMenuButton
                          size="lg"
                          isActive={isActive}
                          tooltip={title}
                          onClick={() => select(wf.id)}
                          className="h-auto items-start gap-2.5 py-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:py-0"
                        >
                          <span className="relative mt-0.5 flex shrink-0 items-center justify-center group-data-[collapsible=icon]:mt-0">
                            <HugeiconsIcon icon={BookOpen01Icon} />
                            <span
                              className={cn(
                                "ring-sidebar absolute -end-0.5 -top-0.5 size-2 rounded-full ring-2",
                                hasCover
                                  ? "bg-chart-2"
                                  : "bg-sidebar-foreground/30",
                              )}
                              aria-hidden
                            />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate text-xs font-medium">
                              {title}
                            </span>
                            <span className="text-sidebar-foreground/60 truncate text-[10px] tabular-nums">
                              {bookConfig.numPages} صفحة ·{" "}
                              {chapterCount === 1
                                ? "فصل واحد"
                                : `${chapterCount} فصول`}
                              {" · "}
                              {bookConfig.pageSize.toUpperCase()}
                            </span>
                          </span>
                        </SidebarMenuButton>
                        <SidebarMenuAction
                          showOnHover
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(wf.id);
                          }}
                          className="hover:text-destructive !top-1/2 !-translate-y-1/2"
                          aria-label={`حذف ${title}`}
                          title={`حذف ${title}`}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            size={16}
                            strokeWidth={2}
                          />
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => openSettings()}
                tooltip={`الإعدادات (${comboText("settings")})`}
                className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center"
              >
                <HugeiconsIcon icon={Settings02Icon} />
                <span className="group-data-[collapsible=icon]:hidden">
                  الإعدادات
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <AppSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialSection={settingsSection}
      />
    </>
  );
}
