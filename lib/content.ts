import "server-only";

import { cache } from "react";

import { getDictionary, type Dictionary } from "./dictionaries";
import {
  CONTENT_FIELDS,
  SHARED_LOCALE,
  contentFieldId,
  isContentKey,
  type ContentKey,
  type ContentLocale,
  type SiteContent,
} from "./content-fields";
import { LOCALES, type Locale } from "./i18n";
import { prisma } from "./prisma";

/**
 * The built-in copy for one language. The database only stores deviations, so
 * an empty `site_content` table renders the site exactly as it shipped.
 *
 * The return type is exhaustive: adding a key to the registry without a default
 * here is a compile error rather than a silently blank section.
 */
export function buildDefaults(dict: Dictionary): SiteContent {
  return {
    "hero.title": dict.home.heroTitle,
    "hero.subtitle": dict.home.heroSubtitle,
    "hero.ctaLabel": dict.home.heroCta,
    "hero.imagePrimary": "",
    "hero.imageSecondary": "",
    "sections.categories.title": dict.home.categoriesTitle,
    "sections.categories.subtitle": dict.home.categoriesSubtitle,
    "sections.featured.title": dict.home.featuredTitle,
    "sections.featured.subtitle": dict.home.featuredSubtitle,
    "sections.signup.title": dict.auth.signUpTitle,
    "sections.signup.subtitle": dict.auth.signUpSubtitle,
    "brand.logo": "",
    "brand.name": dict.meta.siteName,
    "brand.tagline": dict.meta.tagline,
    "brand.description": dict.meta.description,
    "contact.emailOrders": "orders@lilyybakers.com",
    "contact.emailSupport": "contact@lilyybakers.com",
    "contact.phone": "",
    "contact.address": "",
    "contact.hours": dict.footer.openingHours,
    "footer.about": dict.footer.aboutBody,
  };
}

/** Defaults for both languages — the admin form shows them behind "Use default". */
export const getContentDefaults = cache(
  async (): Promise<Record<Locale, SiteContent>> => {
    const [en, no] = await Promise.all([getDictionary("en"), getDictionary("no")]);
    return { en: buildDefaults(en), no: buildDefaults(no) };
  },
);

type ContentRow = { key: string; locale: string; value: string };

/** Rows override the defaults; unknown keys (from an older release) are ignored. */
function applyRows(base: SiteContent, rows: ContentRow[]): SiteContent {
  const merged: SiteContent = { ...base };

  for (const row of rows) {
    if (isContentKey(row.key)) merged[row.key] = row.value;
  }

  return merged;
}

/**
 * Everything the public pages read. Shared (`*`) values are applied first so a
 * language-specific row wins, e.g. an English tagline while the logo stays one
 * photo for both languages.
 */
export const getSiteContent = cache(async (lang: Locale): Promise<SiteContent> => {
  const [dict, rows] = await Promise.all([
    getDictionary(lang),
    prisma.siteContent.findMany({
      where: { locale: { in: [SHARED_LOCALE, lang] } },
      select: { key: true, locale: true, value: true },
    }),
  ]);

  const defaults = buildDefaults(dict);

  return applyRows(
    applyRows(
      defaults,
      rows.filter((row) => row.locale === SHARED_LOCALE),
    ),
    rows.filter((row) => row.locale === lang),
  );
});

/**
 * The admin form works on flat ids (`en.hero.title`, `*.brand.logo`) so a
 * field, its language and its saved state travel together. `stored` lists the
 * ids the database overrides, which drives the "customised" badge.
 */
export type ContentFormState = {
  values: Record<string, string>;
  defaults: Record<string, string>;
  stored: string[];
};

export const getContentFormState = cache(async (): Promise<ContentFormState> => {
  const [defaults, rows] = await Promise.all([
    getContentDefaults(),
    prisma.siteContent.findMany({ select: { key: true, locale: true, value: true } }),
  ]);

  const overrides = new Map(
    rows.filter((row) => isContentKey(row.key)).map((row) => [`${row.locale}.${row.key}`, row.value]),
  );

  const values: Record<string, string> = {};
  const defaultsById: Record<string, string> = {};
  const stored: string[] = [];

  for (const field of CONTENT_FIELDS) {
    // Shared fields keep one id for both languages; localised fields get one
    // per language column.
    const scopes: ContentLocale[] = field.localized ? [...LOCALES] : [SHARED_LOCALE];

    for (const scope of scopes) {
      const locale: Locale = scope === SHARED_LOCALE ? "en" : scope;
      const key = field.key as ContentKey;
      const id = contentFieldId(scope, key);

      defaultsById[id] = defaults[locale][key];

      const override = overrides.get(id);

      if (override !== undefined) {
        values[id] = override;
        stored.push(id);
      } else {
        values[id] = defaultsById[id];
      }
    }
  }

  return { values, defaults: defaultsById, stored };
});
