import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

const TONES: Record<Tone, { bubble: string; wash: string }> = {
  neutral: { bubble: "bg-crust text-cocoa", wash: "from-crust/70" },
  success: { bubble: "bg-emerald-50 text-emerald-800", wash: "from-emerald-50/80" },
  warning: { bubble: "bg-gold/20 text-cocoa", wash: "from-gold/15" },
  danger: { bubble: "bg-berry/10 text-berry", wash: "from-berry/10" },
};

/**
 * One KPI tile for the dashboard grid. `delta` is the percentage change against
 * the previous month; a null baseline hides the pill rather than inventing one.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  href,
  delta,
  deltaLabel,
  positiveIsGood = true,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  delta?: number | null;
  deltaLabel?: string;
  /** Cancelled orders going up is bad, so the pill colour flips. */
  positiveIsGood?: boolean;
  tone?: Tone;
}) {
  const showDelta = typeof delta === "number";
  const good = showDelta && (positiveIsGood ? delta > 0 : delta < 0);
  const flat = delta === 0;
  const palette = TONES[tone];

  const body = (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${palette.wash} to-transparent`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="eyebrow pt-1">{label}</p>
        {icon ? (
          <span
            aria-hidden
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${palette.bubble}`}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className="relative mt-3 font-serif text-[1.7rem] leading-none tracking-tight">{value}</p>

      <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {showDelta ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              flat
                ? "bg-crust text-mocha"
                : good
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-berry/10 text-berry"
            }`}
          >
            <span aria-hidden>{flat ? "→" : delta > 0 ? "▲" : "▼"}</span>
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
        {showDelta && deltaLabel ? (
          <span className="text-[11px] text-mocha">{deltaLabel}</span>
        ) : null}
        {hint ? <p className="w-full text-xs text-mocha">{hint}</p> : null}
      </div>
    </>
  );

  const className =
    "relative block overflow-hidden rounded-2xl border border-cocoa/10 bg-white p-5 shadow-[0_1px_2px_rgba(59,42,32,0.04)]";

  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:border-cocoa/30`}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
