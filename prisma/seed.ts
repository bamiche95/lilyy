/**
 * Database seed — idempotent (upsert by slug / email).
 *
 * Run with: npm run db:seed
 */
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
const imageFor = (slug: string) => (publicUrl ? [`${publicUrl}/products/${slug}.jpg`] : []);
/**
 * Category photos follow the same convention as product photos: the CDN object
 * is named after the slug. Without R2 there is nothing to point at, so the card
 * falls back to the illustrated tile on the home page.
 */
const categoryImageFor = (slug: string) => (publicUrl ? `${publicUrl}/categories/${slug}.jpg` : null);

/**
 * Fixed ids keep the seeded rows stable across environments, so the migration
 * backfill and this seed always agree on which category is which.
 */
const categories = [
  { id: "cat_pies", slug: "pies", nameEn: "Pies", nameNo: "Paier", sortOrder: 0 },
  {
    id: "cat_round_cakes",
    slug: "round-cakes",
    nameEn: "Round Cakes",
    nameNo: "Runde kaker",
    sortOrder: 1,
  },
  { id: "cat_rolls", slug: "rolls", nameEn: "Rolls", nameNo: "Boller", sortOrder: 2 },
  { id: "cat_snacks", slug: "snacks", nameEn: "Snacks", nameNo: "Småbakst", sortOrder: 3 },
] as const;

const products = [
  {
    slug: "surdeigsbrod",
    nameEn: "Classic Sourdough Loaf",
    nameNo: "Klassisk surdeigsbrød",
    descriptionEn:
      "Slow-fermented for 24 hours on our 12-year-old starter, with a blistered crust and an open, custardy crumb.",
    descriptionNo:
      "Sakte hevet i 24 timer på vår 12 år gamle surdeig, med sprø skorpe og luftig, saftig kjerne.",
    price: "89.00",
    categorySlug: "snacks",
    weightGrams: 900,
    allergensEn: ["gluten"],
    allergensNo: ["gluten"],
    ingredientsEn: "Wheat flour, water, sourdough culture, sea salt.",
    ingredientsNo: "Hvetemel, vann, surdeigskultur, havsalt.",
    leadTimeHours: 24,
  },
  {
    slug: "kanelboller",
    nameEn: "Cinnamon Buns",
    nameNo: "Kanelboller",
    descriptionEn:
      "Soft cardamom-spiced dough rolled with cinnamon butter and finished with pearl sugar. Sold in fours.",
    descriptionNo:
      "Myk deig med kardemomme, fylt med kanelsmør og toppet med perlesukker. Selges i firedobbel porsjon.",
    price: "65.00",
    categorySlug: "rolls",
    weightGrams: 480,
    allergensEn: ["gluten", "milk", "egg"],
    allergensNo: ["gluten", "melk", "egg"],
    ingredientsEn: "Wheat flour, milk, butter, sugar, egg, cardamom, cinnamon, pearl sugar.",
    ingredientsNo: "Hvetemel, melk, smør, sukker, egg, kardemomme, kanel, perlesukker.",
    isFeatured: true,
    leadTimeHours: 12,
  },
  {
    slug: "kringle",
    nameEn: "Almond Kringle",
    nameNo: "Mandelkringle",
    descriptionEn:
      "The Norwegian celebration bread: plaited, filled with almond paste and glazed with vanilla icing.",
    descriptionNo: "Den norske festbaken: fletter med mandelmasse og glasur smakt til med vanilje.",
    price: "149.00",
    categorySlug: "round-cakes",
    weightGrams: 650,
    allergensEn: ["gluten", "milk", "egg", "almonds"],
    allergensNo: ["gluten", "melk", "egg", "mandler"],
    ingredientsEn: "Wheat flour, milk, butter, egg, almond paste, icing sugar.",
    ingredientsNo: "Hvetemel, melk, smør, egg, mandelmasse, melis.",
    leadTimeHours: 24,
  },
  {
    slug: "sjokoladekake",
    nameEn: "Chocolate Fudge Cake",
    nameNo: "Sjokoladefudgekake",
    descriptionEn:
      "Three layers of dark chocolate sponge, salted caramel and a glossy ganache. Serves 10–12.",
    descriptionNo:
      "Tre lag mørk sjokoladebunn, saltet karamell og blank ganache. Nok til 10–12 personer.",
    price: "449.00",
    categorySlug: "round-cakes",
    serves: 12,
    allergensEn: ["gluten", "milk", "egg", "soy"],
    allergensNo: ["gluten", "melk", "egg", "soya"],
    ingredientsEn: "Wheat flour, dark chocolate, butter, egg, sugar, cream, sea salt.",
    ingredientsNo: "Hvetemel, mørk sjokolade, smør, egg, sukker, fløte, havsalt.",
    isFeatured: true,
    leadTimeHours: 48,
  },
  {
    slug: "krydderkake",
    nameEn: "Winter Spice Cake",
    nameNo: "Krydderkake",
    descriptionEn:
      "A moist brown-sugar cake with cinnamon, ginger and cloves, dusted with icing sugar.",
    descriptionNo: "Saftig brunsukkerkake med kanel, ingefær og nellik, drysset med melis.",
    price: "379.00",
    categorySlug: "round-cakes",
    serves: 10,
    allergensEn: ["gluten", "milk", "egg"],
    allergensNo: ["gluten", "melk", "egg"],
    ingredientsEn: "Wheat flour, brown sugar, butter, egg, cinnamon, ginger, cloves.",
    ingredientsNo: "Hvetemel, brunsukker, smør, egg, kanel, ingefær, nellik.",
    leadTimeHours: 24,
  },
  {
    slug: "havrekjeks",
    nameEn: "Oat & Honey Cookies",
    nameNo: "Havrekjeks med honning",
    descriptionEn: "Chewy oat cookies sweetened with Norwegian honey. Packed in a 300 g tin.",
    descriptionNo: "Seige havrekjeks søtet med norsk honning. Pakket i 300 g boks.",
    price: "69.00",
    categorySlug: "snacks",
    weightGrams: 300,
    allergensEn: ["gluten", "milk"],
    allergensNo: ["gluten", "melk"],
    ingredientsEn: "Oats, wheat flour, butter, honey, egg, baking soda.",
    ingredientsNo: "Havre, hvetemel, smør, honning, egg, natron.",
    leadTimeHours: 12,
  },
  {
    slug: "ostepai",
    nameEn: "Cheese & Herb Pie",
    nameNo: "Ostepai med urter",
    descriptionEn:
      "Buttery shortcrust filled with aged Jarlsberg, thyme and caramelised onion. Serves 6.",
    descriptionNo:
      "Smørdeig fylt med lagret Jarlsberg, timian og karamellisert løk. Nok til 6 personer.",
    price: "189.00",
    categorySlug: "pies",
    serves: 6,
    allergensEn: ["gluten", "milk", "egg"],
    allergensNo: ["gluten", "melk", "egg"],
    ingredientsEn: "Wheat flour, butter, egg, Jarlsberg, cream, onion, thyme.",
    ingredientsNo: "Hvetemel, smør, egg, Jarlsberg, fløte, løk, timian.",
    leadTimeHours: 24,
  },
  {
    slug: "julebrod",
    nameEn: "Christmas Bread",
    nameNo: "Julebrød",
    descriptionEn:
      "A rich, lightly sweet bread studded with raisins and candied peel. Available November–December.",
    descriptionNo:
      "Et fyldig, lett søtt brød med rosiner og sukat. Tilgjengelig november–desember.",
    price: "129.00",
    categorySlug: "rolls",
    weightGrams: 750,
    allergensEn: ["gluten", "milk", "egg"],
    allergensNo: ["gluten", "melk", "egg"],
    ingredientsEn: "Wheat flour, milk, butter, sugar, raisins, candied peel, cardamom.",
    ingredientsNo: "Hvetemel, melk, smør, sukker, rosiner, sukat, kardemomme.",
    leadTimeHours: 24,
  },
] as const;

async function seedCategories(): Promise<Map<string, string>> {
  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { image: true },
    });
    /**
     * A re-seed must not undo photos uploaded from the admin, so only an empty
     * slot gets the conventional CDN path.
     */
    const image = existing?.image ?? categoryImageFor(category.slug);

    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameEn: category.nameEn,
        nameNo: category.nameNo,
        sortOrder: category.sortOrder,
        image,
      },
      create: { ...category, image },
    });
  }

  const rows = await prisma.category.findMany({ select: { id: true, slug: true } });

  console.log(`✓ ${categories.length} categories upserted`);

  return new Map(rows.map((row) => [row.slug, row.id]));
}

async function seedProducts(categoryIds: Map<string, string>) {
  for (const [index, product] of products.entries()) {
    const { slug, categorySlug, ...rest } = product;
    const categoryId = categoryIds.get(categorySlug);

    if (!categoryId) {
      throw new Error(`Unknown category "${categorySlug}" for product "${slug}"`);
    }

    const data = {
      ...rest,
      categoryId,
      allergensEn: [...product.allergensEn],
      allergensNo: [...product.allergensNo],
      images: imageFor(slug),
      sortOrder: index,
      stock: 20,
      isAvailable: true,
    };

    await prisma.product.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
  }

  console.log(`✓ ${products.length} products upserted`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await auth.api.signUpEmail({
      body: { email, password, name: "Lilyy Admin" },
    });
    console.log(`✓ admin account created for ${email}`);
  } else {
    console.log(`· admin account already exists for ${email}`);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "admin", emailVerified: true, name: "Lilyy Admin" },
  });
  console.log("✓ admin role enforced");
}

async function main() {
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("✗ seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

