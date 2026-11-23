-- Dynamic categories.
--
-- Replaces the fixed `ProductCategory` enum with an editable `categories`
-- table. The enum could not be renamed without a deploy, so the bakery now
-- manages its own shop sections.
--
-- The four categories are seeded with fixed ids (`cat_*`) so the backfill below
-- is deterministic, and every existing product is mapped to one of them.

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNo" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_sortOrder_idx" ON "categories"("sortOrder");

INSERT INTO "categories" ("id", "slug", "nameEn", "nameNo", "sortOrder", "createdAt", "updatedAt") VALUES
    ('cat_pies', 'pies', 'Pies', 'Paier', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_round_cakes', 'round-cakes', 'Round Cakes', 'Runde kaker', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_rolls', 'rolls', 'Rolls', 'Boller', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cat_snacks', 'snacks', 'Snacks', 'Småbakst', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nullable first so the backfill can run, then made required.
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

-- Best-effort mapping of the old enum values onto the new sections; the
-- ELSE branch keeps any unexpected product visible in "Snacks".
UPDATE "products"
SET "categoryId" = CASE "slug"
    WHEN 'ostepai' THEN 'cat_pies'
    WHEN 'sjokoladekake' THEN 'cat_round_cakes'
    WHEN 'krydderkake' THEN 'cat_round_cakes'
    WHEN 'kringle' THEN 'cat_round_cakes'
    WHEN 'kanelboller' THEN 'cat_rolls'
    WHEN 'julebrod' THEN 'cat_rolls'
    WHEN 'surdeigsbrod' THEN 'cat_snacks'
    WHEN 'havrekjeks' THEN 'cat_snacks'
    ELSE 'cat_snacks'
END;

ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;

DROP INDEX "products_category_isAvailable_idx";
ALTER TABLE "products" DROP COLUMN "category";
DROP TYPE "ProductCategory";

CREATE INDEX "products_categoryId_isAvailable_idx" ON "products"("categoryId", "isAvailable");

ALTER TABLE "products"
ADD CONSTRAINT "products_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
