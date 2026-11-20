import { formatPrice } from "@/lib/currency";
import { LOCALE_META, type Locale } from "@/lib/i18n";
import type { DailyPoint } from "@/lib/admin-metrics";

const WIDTH = 720;
const HEIGHT = 240;
const LEFT = 54;
const RIGHT = 12;
const TOP = 18;
const BOTTOM = 196;
const TICKS = 4;

/**
 * Server-rendered sales bars — no charting dependency, no client JavaScript.
 * Each bar carries a `<title>` so the value is reachable with a mouse or a
 * screen reader; a hidden table repeats the series for assistive tech.
 */
export function SalesTrendChart({
  points,
  lang,
  labels,
}: {
  points: DailyPoint[];
  lang: Locale;
  labels: { title: string; subtitle: string; empty: string; total: string; orders: string };
}) {
  const dateLocale = LOCALE_META[lang].dateLocale;
  const dayFormat = new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "short" });
  const compact = new Intl.NumberFormat(dateLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const totalNok = points.reduce((sum, point) => sum + point.revenueNok, 0);
  const totalOrders = points.reduce((sum, point) => sum + point.orders, 0);
  const max = Math.max(0, ...points.map((point) => point.revenueNok));

  const plotHeight = BOTTOM - TOP;
  const slot = (WIDTH - LEFT - RIGHT) / Math.max(points.length, 1);
  const barWidth = Math.min(30, slot * 0.55);
  const lastIndex = points.length - 1;

  return (
    <figure className="card p-5">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg">{labels.title}</h2>
          <p className="mt-0.5 text-xs text-mocha">{labels.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="eyebrow">{labels.total}</p>
          <p className="mt-1 font-serif text-lg leading-none">
            {formatPrice(totalNok, "NOK", lang)}
          </p>
          <p className="mt-1 text-[11px] text-mocha">
            {totalOrders} {labels.orders.toLowerCase()}
          </p>
        </div>
      </figcaption>

      {max === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-cocoa/15 px-4 py-10 text-center text-sm text-mocha">
          {labels.empty}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${labels.title}. ${labels.subtitle}.`}
          className="mt-4 h-auto w-full"
        >
          <defs>
            <linearGradient id="lilyy-sales-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cocoa)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--color-cocoa)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="lilyy-sales-bar-today" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold)" />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {Array.from({ length: TICKS + 1 }, (_, index) => {
            const value = (max / TICKS) * index;
            const y = BOTTOM - (value / max) * plotHeight;

            return (
              <g key={index}>
                <line
                  x1={LEFT}
                  x2={WIDTH - RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-cocoa)"
                  strokeOpacity={index === 0 ? 0.28 : 0.1}
                  strokeDasharray={index === 0 ? undefined : "3 5"}
                />
                <text
                  x={LEFT - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--color-mocha)"
                >
                  {compact.format(Math.round(value))}
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const x = LEFT + slot * index + (slot - barWidth) / 2;
            const height = Math.max(2, (point.revenueNok / max) * plotHeight);
            const isToday = index === lastIndex;
            const label = dayFormat.format(point.date);

            return (
              <g key={point.date.toISOString()}>
                <rect
                  x={x}
                  y={BOTTOM - height}
                  width={barWidth}
                  height={height}
                  rx={5}
                  fill={isToday ? "url(#lilyy-sales-bar-today)" : "url(#lilyy-sales-bar)"}
                  className="transition-opacity hover:opacity-80"
                >
                  <title>{`${label}: ${formatPrice(point.revenueNok, "NOK", lang)} · ${point.orders} ${labels.orders.toLowerCase()}`}</title>
                </rect>
                {index % 2 === 0 || index === lastIndex ? (
                  <text
                    x={x + barWidth / 2}
                    y={BOTTOM + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isToday ? "var(--color-cocoa)" : "var(--color-mocha)"}
                  >
                    {label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}

      <table className="sr-only">
        <caption>{labels.title}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.subtitle}</th>
            <th scope="col">{labels.total}</th>
            <th scope="col">{labels.orders}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date.toISOString()}>
              <th scope="row">{dayFormat.format(point.date)}</th>
              <td>{formatPrice(point.revenueNok, "NOK", lang)}</td>
              <td>{point.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
