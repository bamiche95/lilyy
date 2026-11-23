"use server";

import { revalidatePath } from "next/cache";

import { getContentDefaults } from "@/lib/content";
import {
  CONTENT_IMAGE_KEYS,
  SHARED_LOCALE,
  contentField,
  isContentKey,
  type ContentField,
  type ContentKey,
  type ContentLocale,
} from "@/lib/content-fields";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { deleteObject, isR2Configured, keyFromPublicUrl } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";
import { emailSchema, optionalImageUrlSchema, phoneSchema } from "@/lib/validation";

export type ContentActionState = {
  ok: boolean;
  /** Dictionary key under `adminContent`. */
  message?: "invalid" | "saved" | "restored" | "error";
  fieldErrors?: Record<string, string>;
};

type Entry = { key: ContentKey; locale: ContentLocale; value: string };

type Write = Entry;

/**
 * Reads `content.<locale>.<key>` inputs. Unknown keys and a locale that does
 * not match the field's scope are rejected outright — the form is generated
 * from the same registry, so a mismatch means a tampered request.
 */
function parseEntries(formData: FormData): Entry[] | null {
  const entries: Entry[] = [];

  for (const [name, raw] of formData.entries()) {
    if (!name.startsWith("content.")) continue;
    if (typeof raw !== "string") return null;

    // The key itself contains dots (`hero.title`), the locale does not.
    const [, scope, ...rest] = name.split(".");
    const key = rest.join(".");

    if (!scope || !isContentKey(key)) return null;

    const locale: ContentLocale | null =
      scope === SHARED_LOCALE ? SHARED_LOCALE : isLocale(scope) ? scope : null;

    if (!locale) return null;

    const field = contentField(key);
    const inScope = field.localized ? locale !== SHARED_LOCALE : locale === SHARED_LOCALE;

    if (!inScope) return null;

    entries.push({ key, locale, value: raw });
  }

  return entries.length > 0 ? entries : null;
}

function validateField(field: ContentField, raw: string): string | { error: string } {
  const value = raw.trim();

  // Blank is a deliberate choice: the field hides rather than reverting.
  if (value.length === 0) return "";

  switch (field.type) {
    case "email":
      return emailSchema.safeParse(value).success ? value : { error: "Enter a valid email address" };
    case "tel":
      return phoneSchema.safeParse(value).success ? value : { error: "Enter a valid phone number" };
    case "image": {
      const parsed = optionalImageUrlSchema.safeParse(value);
      return parsed.success && parsed.data ? parsed.data : { error: "Use a full image URL" };
    }
    default:
      return value.length <= field.maxLength
        ? value
        : { error: `Keep it under ${field.maxLength} characters` };
  }
}

function isValidationError(value: string | { error: string }): value is { error: string } {
  return typeof value !== "string";
}

/** Public URLs of every photo the content registry still points at. */
async function contentImageUrls(): Promise<string[]> {
  const rows = await prisma.siteContent.findMany({
    where: { key: { in: CONTENT_IMAGE_KEYS } },
    select: { value: true },
  });

  return rows.map((row) => row.value).filter((value) => value.length > 0);
}

/**
 * Deletes a photo this app uploaded once no content field references it.
 * Pasted URLs from other hosts are ignored and a storage hiccup never fails
 * the save — a stale object is a smaller problem than lost copy.
 */
async function releaseContentImage(url: string) {
  if (!isR2Configured()) return;

  const key = keyFromPublicUrl(url);
  if (!key) return;

  try {
    await deleteObject(key);
  } catch (error) {
    console.error("site content photo cleanup failed", error);
  }
}

async function releaseUnusedImages(previous: string[]) {
  const stillUsed = new Set(await contentImageUrls());

  for (const url of new Set(previous)) {
    if (!stillUsed.has(url)) await releaseContentImage(url);
  }
}

/**
 * Saves every content field the form rendered. A value equal to the built-in
 * default deletes the row instead of storing a duplicate, so "Use default" and
 * a plain save both leave the table clean.
 */
export async function saveContent(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  await requireAdmin(`/${lang}`);

  const entries = parseEntries(formData);

  if (!entries) {
    return { ok: false, message: "invalid" };
  }

  const defaults = await getContentDefaults();
  const fieldErrors: Record<string, string> = {};
  const writes: Write[] = [];
  const removals: { key: string; locale: string }[] = [];

  for (const entry of entries) {
    const field = contentField(entry.key);
    const checked = validateField(field, entry.value);

    if (isValidationError(checked)) {
      fieldErrors[`content.${entry.locale}.${entry.key}`] = checked.error;
      continue;
    }

    const fallback = defaults[entry.locale === SHARED_LOCALE ? "en" : entry.locale][entry.key];

    if (checked === fallback) {
      removals.push({ key: entry.key, locale: entry.locale });
    } else {
      writes.push({ key: entry.key, locale: entry.locale, value: checked });
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "invalid", fieldErrors };
  }

  try {
    // Captured before the change so a replaced upload can be cleaned up.
    const previousImages = await contentImageUrls();

    await prisma.$transaction([
      ...removals.map((removal) =>
        prisma.siteContent.deleteMany({ where: { key: removal.key, locale: removal.locale } }),
      ),
      ...writes.map((write) =>
        prisma.siteContent.upsert({
          where: { key_locale: { key: write.key, locale: write.locale } },
          create: { key: write.key, locale: write.locale, value: write.value },
          update: { value: write.value },
        }),
      ),
    ]);

    await releaseUnusedImages(previousImages);

    revalidatePath("/", "layout");

    return { ok: true, message: "saved" };
  } catch (error) {
    console.error("saveContent failed", error);
    return { ok: false, message: "error" };
  }
}

/** Drops every override, bringing back the copy and photos shipped in code. */
export async function restoreContentDefaults(
  _previous: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  await requireAdmin(`/${lang}`);

  try {
    const previousImages = await contentImageUrls();

    await prisma.siteContent.deleteMany();

    await releaseUnusedImages(previousImages);

    revalidatePath("/", "layout");

    return { ok: true, message: "restored" };
  } catch (error) {
    console.error("restoreContentDefaults failed", error);
    return { ok: false, message: "error" };
  }
}
