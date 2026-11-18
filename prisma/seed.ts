/**
 * Database seed — idempotent (upsert by slug / email).
 *
 * Run with: npm run db:seed
 */
import { ProductCategory } from "@prisma/client";

import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
const imageFor = (slug: string) => (publicUrl ? [`${publicUrl}/products/${slug}.jpg`] : []);

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
    category: ProductCategory.BREAD,
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
    category: ProductCategory.PASTRY,
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
    category: ProductCategory.PASTRY,
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
    category: ProductCategory.CAKE,
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
    category: ProductCategory.CAKE,
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
    category: ProductCategory.COOKIES,
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
    category: ProductCategory.SAVOURY,
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
    category: ProductCategory.SEASONAL,
    weightGrams: 750,
    allergensEn: ["gluten", "milk", "egg"],
    allergensNo: ["gluten", "melk", "egg"],
    ingredientsEn: "Wheat flour, milk, butter, sugar, raisins, candied peel, cardamom.",
    ingredientsNo: "Hvetemel, melk, smør, sukker, rosiner, sukat, kardemomme.",
    leadTimeHours: 24,
  },
] as const;

async function seedProducts() {
  for (const [index, product] of products.entries()) {
    const { slug, ...rest } = product;

    const data = {
      ...rest,
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
  await seedProducts();
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

