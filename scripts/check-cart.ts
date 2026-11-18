import {
  cartCount,
  cartSubtotalNok,
  mergeCartLine,
  sanitiseCartLines,
  setCartQuantity,
  type CartLine,
} from "../lib/cart";

const line = (id: string, price: number, quantity = 1): CartLine => ({
  productId: id,
  slug: id,
  nameEn: id,
  nameNo: id,
  price,
  image: null,
  quantity,
});

const results: [string, boolean, string][] = [];
const check = (label: string, ok: boolean, detail = "") => results.push([label, ok, detail]);

// sanitiseCartLines drops junk and sums duplicates
const dirty = sanitiseCartLines([
  { productId: "a", slug: "a", price: 65, quantity: 2, nameEn: "A" },
  { productId: "a", slug: "a", price: 65, quantity: 3, nameEn: "A" },
  { productId: "", slug: "x", price: 10 },
  { productId: "b", slug: "b", price: Number.NaN },
  { productId: "c", slug: "c", price: 149, quantity: 999 },
  null,
  42,
]);
check("sanitise keeps valid lines", dirty.length === 2, JSON.stringify(dirty.map((l) => l.productId)));
check("sanitise sums duplicates", dirty[0]?.quantity === 5, String(dirty[0]?.quantity));
check("sanitise clamps quantity", dirty[1]?.quantity === 50, String(dirty[1]?.quantity));
check("sanitise tolerates non-arrays", sanitiseCartLines("nope").length === 0);

// merge behaviour
const merged = mergeCartLine([line("a", 65, 2)], line("a", 70, 1));
check("merge bumps quantity", merged.length === 1 && merged[0].quantity === 3, JSON.stringify(merged));
check("merge refreshes price", merged[0].price === 70, String(merged[0].price));

const capped = mergeCartLine([line("a", 65, 49)], line("a", 65, 10));
check("merge respects the per-line cap", capped[0].quantity === 50, String(capped[0].quantity));

// quantity updates
const removed = setCartQuantity([line("a", 65, 1), line("b", 89, 1)], "a", 0);
check("quantity 0 removes the line", removed.length === 1 && removed[0].productId === "b");

const bumped = setCartQuantity([line("a", 65, 1)], "a", 4);
check("quantity update sticks", bumped[0].quantity === 4, String(bumped[0].quantity));

// totals
const basket = [line("a", 65, 2), line("b", 89, 1)];
check("count totals all units", cartCount(basket) === 3, String(cartCount(basket)));
check("subtotal adds units exactly", cartSubtotalNok(basket) === 219, String(cartSubtotalNok(basket)));
check("subtotal rounds to øre", cartSubtotalNok([line("a", 0.1, 3)]) === 0.3);

const passed = results.filter(([, ok]) => ok).length;
for (const [label, ok, detail] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
console.log(`\n${passed}/${results.length} cart checks passed`);
if (passed !== results.length) process.exitCode = 1;
