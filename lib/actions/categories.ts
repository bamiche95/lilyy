"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { fieldErrors } from "@/lib/validation";

export type CategoryActionState = {
  ok: boolean;
  /** Dictionary key under `adminCategories`. */
  message?: "invalid" | "saved" | "created" | "notFound" | "inUse" | "error";
  fieldErrors?: Record<string, string>;
  categoryId?: string;
  /** Set with `inUse` so the UI can name how many products still point here. */
  productCount?: number;
};

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalInt = (max = 1_000_000) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(max).optional());

const inputSchema = z.object({
  slug: z.string().trim().max(80).optional(),
  nameEn: z.string().trim().min(2, "English name is required").max(80),
  nameNo: z.string().trim().min(2, "Norwegian name is required").max(80),
  sortOrder: optionalInt(10_000),
});

function readForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");

  return {
    slug: text("slug"),
    nameEn: text("nameEn"),
    nameNo: text("nameNo"),
    sortOrder: text("sortOrder"),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2003";
}

/** Categories label the header, shop filters and admin list — refresh them all. */
function refreshCatalogue() {
  revalidatePath("/", "layout");
}

export async function saveCategory(
  _previous: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  await requireAdmin(`/${lang}`);

  const parsed = inputSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { ok: false, message: "invalid", fieldErrors: fieldErrors(parsed.error) };
  }

  const input = parsed.data;
  const slug = slugify(input.slug || input.nameEn) || `category-${Date.now().toString(36)}`;

  const data = {
    slug,
    nameEn: input.nameEn,
    nameNo: input.nameNo,
    sortOrder: input.sortOrder ?? 0,
  };

  try {
    const category = id
      ? await prisma.category.update({ where: { id }, data })
      : await prisma.category.create({ data });

    refreshCatalogue();

    return { ok: true, message: id ? "saved" : "created", categoryId: category.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: "invalid",
        fieldErrors: { slug: "That slug is already in use." },
      };
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return { ok: false, message: "notFound" };
    }

    console.error("saveCategory failed", error);
    return { ok: false, message: "error" };
  }
}

/**
 * Deletes an empty category. The `Restrict` foreign key is the real guard; the
 * count first gives the admin a useful message instead of a database error.
 */
export async function deleteCategory(
  _previous: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  await requireAdmin(`/${lang}`);

  if (!id) {
    return { ok: false, message: "invalid" };
  }

  try {
    const productCount = await prisma.product.count({ where: { categoryId: id } });

    if (productCount > 0) {
      return { ok: false, message: "inUse", productCount };
    }

    await prisma.category.delete({ where: { id } });
    refreshCatalogue();

    return { ok: true, message: "saved" };
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      const productCount = await prisma.product.count({ where: { categoryId: id } });
      return { ok: false, message: "inUse", productCount };
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return { ok: false, message: "notFound" };
    }

    console.error("deleteCategory failed", error);
    return { ok: false, message: "error" };
  }
}
