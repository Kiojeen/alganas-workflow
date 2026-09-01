import { useEffect, useState } from "react";
import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

function SiteHeader({ title }: { title: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header
      className={cn(
        "bg-sidebar flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-shadow duration-200 ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        scrolled ? "sticky top-0 z-50 shadow" : "shadow-none",
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="size-7 shrink-0">
          <HugeiconsIcon icon={SidebarLeftIcon} className="size-4" />
        </SidebarTrigger>
        <Separator orientation="vertical" className="mx-2" />
        <span className="text-sm font-semibold">
          {title || "اختر مشروعًا"}
        </span>
      </div>

      <div className="flex gap-1 px-4 lg:gap-2 lg:px-6">
        <ModeToggle />
      </div>
    </header>
  );
}

export { SiteHeader };
