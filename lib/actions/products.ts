"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PRODUCT_CATEGORIES } from "@/lib/shop";
import { slugify } from "@/lib/utils";
import { fieldErrors } from "@/lib/validation";

export type ProductActionState = {
  ok: boolean;
  /** Dictionary key under `adminProducts` — keeps copy in the JSON bundles. */
  message?: "invalid" | "saved" | "created" | "notFound" | "error";
  fieldErrors?: Record<string, string>;
  productId?: string;
};

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalInt = (max = 1_000_000) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(max).optional());

const optionalMoney = z.preprocess(
  blankToUndefined,
  z.coerce.number().min(0).max(1_000_000).optional(),
);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const inputSchema = z.object({
  slug: z.string().trim().max(120).optional(),
  nameEn: z.string().trim().min(2, "English name is required").max(120),
  nameNo: z.string().trim().min(2, "Norwegian name is required").max(120),
  descriptionEn: z.string().trim().min(10, "Add a short English description").max(4000),
  descriptionNo: z.string().trim().min(10, "Add a short Norwegian description").max(4000),
  ingredientsEn: optionalText(2000),
  ingredientsNo: optionalText(2000),
  allergensEn: z.array(z.string().trim().min(1).max(60)).max(30),
  allergensNo: z.array(z.string().trim().min(1).max(60)).max(30),
  price: z.coerce.number().min(0, "Price cannot be negative").max(1_000_000),
  compareAtPrice: optionalMoney,
  category: z.enum(PRODUCT_CATEGORIES),
  weightGrams: optionalInt(),
  serves: optionalInt(1000),
  leadTimeHours: optionalInt(720),
  stock: optionalInt(),
  sortOrder: optionalInt(10_000),
  isFeatured: z.boolean(),
  isAvailable: z.boolean(),
});

function readForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  const list = (key: string) =>
    text(key)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 30);
  const flag = (key: string) => formData.get(key) === "on" || formData.get(key) === "true";

  return {
    slug: text("slug"),
    nameEn: text("nameEn"),
    nameNo: text("nameNo"),
    descriptionEn: text("descriptionEn"),
    descriptionNo: text("descriptionNo"),
    ingredientsEn: text("ingredientsEn"),
    ingredientsNo: text("ingredientsNo"),
    allergensEn: list("allergensEn"),
    allergensNo: list("allergensNo"),
    price: text("price"),
    compareAtPrice: text("compareAtPrice"),
    category: text("category"),
    weightGrams: text("weightGrams"),
    serves: text("serves"),
    leadTimeHours: text("leadTimeHours"),
    stock: text("stock"),
    sortOrder: text("sortOrder"),
    isFeatured: flag("isFeatured"),
    isAvailable: flag("isAvailable"),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/** Products feed the shop, home page and admin list — refresh them together. */
function refreshCatalogue() {
  revalidatePath("/", "layout");
}

export async function saveProduct(
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  await requireAdmin(`/${lang}`);

  const parsed = inputSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { ok: false, message: "invalid", fieldErrors: fieldErrors(parsed.error) };
  }

  const input = parsed.data;
  const slug = slugify(input.slug || input.nameEn) || `product-${Date.now().toString(36)}`;

  const data = {
    slug,
    nameEn: input.nameEn,
    nameNo: input.nameNo,
    descriptionEn: input.descriptionEn,
    descriptionNo: input.descriptionNo,
    ingredientsEn: input.ingredientsEn,
    ingredientsNo: input.ingredientsNo,
    allergensEn: input.allergensEn,
    allergensNo: input.allergensNo,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    category: input.category,
    weightGrams: input.weightGrams ?? null,
    serves: input.serves ?? null,
    leadTimeHours: input.leadTimeHours ?? 24,
    stock: input.stock ?? 0,
    sortOrder: input.sortOrder ?? 0,
    isFeatured: input.isFeatured,
    isAvailable: input.isAvailable,
  };

  try {
    const product = id
      ? await prisma.product.update({ where: { id }, data })
      : await prisma.product.create({ data });

    refreshCatalogue();

    return { ok: true, message: id ? "saved" : "created", productId: product.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "invalid",
        fieldErrors: { slug: "That slug is already in use." },
      };
    }

    console.error("saveProduct failed", error);
    return { ok: false, message: "error" };
  }
}

/** Persists the whole photo list; the first entry is the listing thumbnail. */
export async function setProductImages(
  productId: string,
  images: string[],
): Promise<{ ok: boolean; images?: string[]; error?: "invalid" | "error" }> {
  await requireAdmin();

  if (typeof productId !== "string" || productId.length === 0) {
    return { ok: false, error: "invalid" };
  }

  const urls = [
    ...new Set(
      (Array.isArray(images) ? images : []).filter(
        (url): url is string => typeof url === "string" && /^https?:\/\//i.test(url.trim()),
      ),
    ),
  ]
    .slice(0, 8)
    .map((url) => url.trim());

  try {
    await prisma.product.update({ where: { id: productId }, data: { images: urls } });
    refreshCatalogue();
    return { ok: true, images: urls };
  } catch (error) {
    console.error("setProductImages failed", error);
    return { ok: false, error: "error" };
  }
}

export async function setProductAvailability(
  productId: string,
  isAvailable: boolean,
): Promise<{ ok: boolean; error?: "invalid" | "error" }> {
  await requireAdmin();

  if (typeof productId !== "string" || productId.length === 0) {
    return { ok: false, error: "invalid" };
  }

  try {
    await prisma.product.update({ where: { id: productId }, data: { isAvailable } });
    refreshCatalogue();
    return { ok: true };
  } catch (error) {
    console.error("setProductAvailability failed", error);
    return { ok: false, error: "error" };
  }
}

