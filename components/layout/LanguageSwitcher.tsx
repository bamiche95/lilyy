"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { setPreferences } from "@/lib/actions/preferences";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  label,
  tone = "light",
}: {
  locale: Locale;
  label: string;
  /** `dark` inverts the control for the cocoa header; the drawer keeps `light`. */
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const onDark = tone === "dark";

  function change(next: Locale) {
    if (next === locale) return;

    setError(null);

    const segments = pathname.split("/").filter(Boolean);
    segments[0] = next;
    const target = `/${segments.join("/")}`;

    startTransition(async () => {
      const result = await setPreferences({ locale: next });

      if (!result.ok) {
        setError(result.error ?? "error");
        return;
      }

      router.push(target);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex items-center gap-0.5 rounded-full border p-0.5",
        onDark ? "border-cream/25" : "border-cocoa/15",
      )}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => change(code)}
          disabled={isPending}
          aria-pressed={code === locale}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition",
            code === locale
              ? onDark
                ? "bg-cream text-cocoa"
                : "bg-cocoa text-cream"
              : onDark
                ? "text-cream/70 hover:bg-cream/10 hover:text-cream"
                : "text-mocha hover:bg-crust",
            isPending && "opacity-70",
          )}
        >
          {code}
        </button>
      ))}
      {error ? <span className="sr-only">{error}</span> : null}
    </div>
  );
}
