import type { TopProduct } from "@/lib/admin-metrics";
import { formatPrice } from "@/lib/currency";
import { localised, type Locale } from "@/lib/i18n";

/** Best sellers by units paid, with a revenue whisper. */
export function TopProducts({
  products,
  lang,
  labels,
}: {
  products: TopProduct[];
  lang: Locale;
  labels: { title: string; empty: string; units: string };
}) {
  const max = Math.max(1, ...products.map((product) => product.quantity));

  return (
    <section className="card flex h-full flex-col p-5">
      <h2 className="text-lg">{labels.title}</h2>

      {products.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-cocoa/15 px-4 py-8 text-center text-sm text-mocha">
          {labels.empty}
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {products.map((product, index) => (
            <li key={`${product.nameEn}-${index}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex min-w-0 items-baseline gap-2 text-sm">
                  <span className="w-4 shrink-0 text-[11px] font-semibold text-mocha">
                    {index + 1}
                  </span>
                  <span className="truncate">{localised(lang, product.nameEn, product.nameNo)}</span>
                </p>
                <p className="shrink-0 text-xs tabular-nums text-mocha">
                  {product.quantity} {labels.units}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-crust">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(8, (product.quantity / max) * 100)}%` }}
                  />
                </div>
                <p className="w-20 shrink-0 text-right text-[11px] tabular-nums text-mocha">
                  {formatPrice(product.revenueNok, "NOK", lang)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
