import { useEffect, useRef } from "react";

/**
 * Keyboard shortcuts for the desk. Combos match on the physical key
 * (`event.code`) so they work the same on Arabic and Latin layouts. Plain
 * keys (no Ctrl/Alt) stay quiet while typing in a field or inside a dialog.
 */

export type ShortcutId =
  | "settings"
  | "shortcuts"
  | "new-project"
  | "theme"
  | "sidebar"
  | "export"
  | "tab-file"
  | "tab-design"
  | "guides"
  | "prev-chapter"
  | "next-chapter"
  | "upload"
  | "paste"
  | "paste-back"
  | "ai-image"
  | "ai-image-back"
  | "ai-text"
  | "ai-both";

export type KeyCombo = {
  /** `KeyboardEvent.code`, e.g. `KeyS`, `Digit1`, `BracketLeft`. */
  code: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Label for the key itself when the code is not self-explanatory. */
  display?: string;
};

export type Shortcut = {
  id: ShortcutId;
  group: string;
  label: string;
  combo: KeyCombo;
  /** Handled elsewhere (e.g. the sidebar); listed for the sheet only. */
  builtIn?: boolean;
};

export const SHORTCUTS: Shortcut[] = [
  {
    id: "settings",
    group: "عام",
    label: "الإعدادات",
    combo: { code: "Comma", ctrl: true, display: "," },
  },
  {
    id: "shortcuts",
    group: "عام",
    label: "ورقة الاختصارات",
    combo: { code: "Slash", shift: true, display: "?" },
  },
  {
    id: "new-project",
    group: "عام",
    label: "مشروع جديد",
    combo: { code: "KeyN", display: "N" },
  },
  {
    id: "sidebar",
    group: "عام",
    label: "إظهار/إخفاء الشريط الجانبي",
    combo: { code: "KeyB", ctrl: true, display: "B" },
    builtIn: true,
  },
  {
    id: "theme",
    group: "عام",
    label: "تبديل المظهر الفاتح/الداكن",
    combo: { code: "KeyD", display: "D" },
  },
  {
    id: "export",
    group: "المشروع",
    label: "تصدير الغلاف وملفات PDF",
    combo: { code: "KeyS", ctrl: true, display: "S" },
  },
  {
    id: "tab-file",
    group: "المشروع",
    label: "تبويب الملف والكتاب",
    combo: { code: "Digit1", display: "1" },
  },
  {
    id: "tab-design",
    group: "المشروع",
    label: "تبويب التصميم",
    combo: { code: "Digit2", display: "2" },
  },
  {
    id: "guides",
    group: "المشروع",
    label: "إظهار/إخفاء الأدلة",
    combo: { code: "KeyG", display: "G" },
  },
  {
    id: "prev-chapter",
    group: "المشروع",
    label: "الفصل السابق في المعاينة",
    combo: { code: "BracketRight", display: "]" },
  },
  {
    id: "next-chapter",
    group: "المشروع",
    label: "الفصل التالي في المعاينة",
    combo: { code: "BracketLeft", display: "[" },
  },
  {
    id: "upload",
    group: "الملف",
    label: "رفع صورة أو PDF",
    combo: { code: "KeyU", display: "U" },
  },
  {
    id: "paste",
    group: "الملف",
    label: "لصق صورة الغلاف",
    combo: { code: "KeyV", ctrl: true, display: "V" },
    // Handled on the paste event so a file copied from the OS comes along.
    builtIn: true,
  },
  {
    id: "paste-back",
    group: "الملف",
    label: "لصق صورة الظهر",
    combo: { code: "KeyV", ctrl: true, shift: true, display: "V" },
    // The browser gives this combo an empty paste event, so the clipboard
    // is read directly from the keydown instead.
    builtIn: true,
  },
  {
    id: "ai-image",
    group: "الملف",
    label: "توليد صورة الغلاف",
    combo: { code: "KeyI", display: "I" },
  },
  {
    id: "ai-image-back",
    group: "الملف",
    label: "توليد صورة الظهر",
    combo: { code: "KeyI", shift: true, display: "I" },
  },
  {
    id: "ai-text",
    group: "الملف",
    label: "استخراج الاسم والوصف",
    combo: { code: "KeyT", display: "T" },
  },
  {
    id: "ai-both",
    group: "الملف",
    label: "الاسم والوصف ثم الصورة",
    combo: { code: "KeyA", display: "A" },
  },
];

export const SHORTCUT_GROUPS = [...new Set(SHORTCUTS.map((s) => s.group))];

export function shortcutFor(id: ShortcutId): Shortcut {
  const found = SHORTCUTS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown shortcut: ${id}`);
  return found;
}

export function isMacLike() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

/** Key names for display, e.g. `["Ctrl", "S"]` or `["⌘", "S"]`. */
export function comboKeys(combo: KeyCombo, mac = isMacLike()): string[] {
  const keys: string[] = [];
  if (combo.ctrl) keys.push(mac ? "⌘" : "Ctrl");
  if (combo.alt) keys.push(mac ? "⌥" : "Alt");
  if (combo.shift && combo.display !== "?") keys.push(mac ? "⇧" : "Shift");
  keys.push(combo.display ?? combo.code.replace(/^(Key|Digit)/, ""));
  return keys;
}

/** Short inline form for tooltips: `Ctrl+S`. */
export function comboText(id: ShortcutId): string {
  return comboKeys(shortcutFor(id).combo).join("+");
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="menu"], [role="slider"]',
    ),
  );
}

export function matchesCombo(event: KeyboardEvent, combo: KeyCombo) {
  const ctrl = event.ctrlKey || event.metaKey;
  if (Boolean(combo.ctrl) !== ctrl) return false;
  if (Boolean(combo.alt) !== event.altKey) return false;
  if (Boolean(combo.shift) !== event.shiftKey) return false;
  return event.code === combo.code;
}

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

/**
 * Binds handlers to the shortcut table. Plain-key combos are ignored while a
 * field has focus or a dialog is open, so typing never triggers them.
 */
export function useShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      const target = event.target;
      const inDialog =
        target instanceof HTMLElement &&
        target.closest('[role="dialog"], [role="alertdialog"]') !== null;
      for (const shortcut of SHORTCUTS) {
        const handler = ref.current[shortcut.id];
        if (!handler || shortcut.builtIn) continue;
        if (!matchesCombo(event, shortcut.combo)) continue;
        const plain = !shortcut.combo.ctrl && !shortcut.combo.alt;
        if (plain && (isEditableTarget(target) || inDialog)) return;
        event.preventDefault();
        handler();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
