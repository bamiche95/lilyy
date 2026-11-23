import type { Locale } from "./i18n";

/**
 * The content registry: every marketing-facing string, photo and contact
 * detail the bakery can edit from `/admin/content`.
 *
 * It is the single source of truth, read by the loader, the save action, the
 * public pages and the admin form. Adding a field means one entry here plus one
 * line in `buildDefaults` (`lib/content.ts`) — no migration, no new column.
 */

/** `locale = "*"` rows hold language-neutral values (photos, e-mails, phone). */
export const SHARED_LOCALE = "*";

export type ContentLocale = Locale | typeof SHARED_LOCALE;

export type ContentGroup = "hero" | "sections" | "brand" | "contact" | "footer";

export type ContentFieldType = "text" | "textarea" | "image" | "email" | "tel";

export type ContentField = {
  key: string;
  group: ContentGroup;
  type: ContentFieldType;
  /** false = one value serves every language. */
  localized: boolean;
  /** Character cap for text-like fields; ignored for images. */
  maxLength: number;
  label: Record<Locale, string>;
  hint?: Record<Locale, string>;
};

export const CONTENT_GROUPS = [
  { id: "hero", label: { en: "Home page hero", no: "Forsidebanner" } },
  { id: "sections", label: { en: "Home page sections", no: "Seksjoner på forsiden" } },
  { id: "brand", label: { en: "Brand & link preview", no: "Merkevare og lenkeforhåndsvisning" } },
  { id: "contact", label: { en: "Contact details", no: "Kontaktinformasjon" } },
  { id: "footer", label: { en: "Footer", no: "Sidefot" } },
] as const satisfies readonly { id: ContentGroup; label: Record<Locale, string> }[];

export const CONTENT_FIELDS = [
  {
    key: "hero.title",
    group: "hero",
    type: "text",
    localized: true,
    maxLength: 120,
    label: { en: "Headline", no: "Overskrift" },
    hint: {
      en: "The large line at the top of the home page.",
      no: "Den store linjen øverst på forsiden.",
    },
  },
  {
    key: "hero.subtitle",
    group: "hero",
    type: "textarea",
    localized: true,
    maxLength: 400,
    label: { en: "Intro text", no: "Ingress" },
    hint: {
      en: "One or two sentences under the headline.",
      no: "Én eller to setninger under overskriften.",
    },
  },
  {
    key: "hero.ctaLabel",
    group: "hero",
    type: "text",
    localized: true,
    maxLength: 60,
    label: { en: "Shop button label", no: "Butikknapp" },
    hint: {
      en: "The label on the button that leads to the shop.",
      no: "Teksten på knappen som fører til butikken.",
    },
  },
  {
    key: "hero.imagePrimary",
    group: "hero",
    type: "image",
    localized: false,
    maxLength: 600,
    label: { en: "Tall hero photo", no: "Høyt hovedbilde" },
    hint: {
      en: "The left photo in the hero. Falls back to the bundled bakery photo.",
      no: "Bildet til venstre i banneret. Faller tilbake til det innebygde bakeribildet.",
    },
  },
  {
    key: "hero.imageSecondary",
    group: "hero",
    type: "image",
    localized: false,
    maxLength: 600,
    label: { en: "Small hero photo", no: "Lite hovedbilde" },
    hint: {
      en: "The offset photo to the right. Falls back to the bundled counter photo.",
      no: "Det forskjøvede bildet til høyre. Faller tilbake til det innebygde diskebildet.",
    },
  },
  {
    key: "sections.categories.title",
    group: "sections",
    type: "text",
    localized: true,
    maxLength: 100,
    label: { en: "Categories heading", no: "Overskrift kategorier" },
  },
  {
    key: "sections.categories.subtitle",
    group: "sections",
    type: "textarea",
    localized: true,
    maxLength: 300,
    label: { en: "Categories intro", no: "Ingress kategorier" },
  },
  {
    key: "sections.featured.title",
    group: "sections",
    type: "text",
    localized: true,
    maxLength: 100,
    label: { en: "Favourites heading", no: "Overskrift favoritter" },
  },
  {
    key: "sections.featured.subtitle",
    group: "sections",
    type: "textarea",
    localized: true,
    maxLength: 300,
    label: { en: "Favourites intro", no: "Ingress favoritter" },
  },
  {
    key: "sections.signup.title",
    group: "sections",
    type: "text",
    localized: true,
    maxLength: 100,
    label: { en: "Sign-up heading", no: "Overskrift konto" },
  },
  {
    key: "sections.signup.subtitle",
    group: "sections",
    type: "textarea",
    localized: true,
    maxLength: 300,
    label: { en: "Sign-up intro", no: "Ingress konto" },
  },
  {
    key: "brand.logo",
    group: "brand",
    type: "image",
    localized: false,
    maxLength: 600,
    label: { en: "Logo", no: "Logo" },
    hint: {
      en: "Shown in the header. A wide, transparent PNG works best; the bundled lockup is used when empty.",
      no: "Vises i toppteksten. En bred PNG med gjennomsiktig bakgrunn fungerer best; den innebygde logoen brukes når feltet er tomt.",
    },
  },
  {
    key: "brand.name",
    group: "brand",
    type: "text",
    localized: true,
    maxLength: 80,
    label: { en: "Business name", no: "Bedriftsnavn" },
    hint: {
      en: "Used in the browser tab, link previews and the footer.",
      no: "Brukes i fanen, lenkeforhåndsvisninger og sidefoten.",
    },
  },
  {
    key: "brand.tagline",
    group: "brand",
    type: "text",
    localized: true,
    maxLength: 160,
    label: { en: "Tagline", no: "Slagord" },
    hint: {
      en: "The short line above the hero headline and in search results.",
      no: "Den korte linjen over overskriften og i søkeresultater.",
    },
  },
  {
    key: "brand.description",
    group: "brand",
    type: "textarea",
    localized: true,
    maxLength: 320,
    label: { en: "Meta description", no: "Metabeskrivelse" },
    hint: {
      en: "One or two sentences for search engines and link previews.",
      no: "Én eller to setninger for søkemotorer og lenkeforhåndsvisninger.",
    },
  },
  {
    key: "contact.emailOrders",
    group: "contact",
    type: "email",
    localized: false,
    maxLength: 160,
    label: { en: "Orders e-mail", no: "Ordre-e-post" },
    hint: {
      en: "Shown in the footer. Transactional mail still uses ORDERS_EMAIL.",
      no: "Vises i sidefoten. Systemutsendinger bruker fortsatt ORDERS_EMAIL.",
    },
  },
  {
    key: "contact.emailSupport",
    group: "contact",
    type: "email",
    localized: false,
    maxLength: 160,
    label: { en: "Support e-mail", no: "Kundestøtte-e-post" },
    hint: {
      en: "Shown in the footer. Support replies still use SUPPORT_EMAIL.",
      no: "Vises i sidefoten. Svar på kundestøtte bruker fortsatt SUPPORT_EMAIL.",
    },
  },
  {
    key: "contact.phone",
    group: "contact",
    type: "tel",
    localized: false,
    maxLength: 40,
    label: { en: "Phone", no: "Telefon" },
    hint: { en: "Leave empty to hide the row.", no: "La stå tom for å skjule raden." },
  },
  {
    key: "contact.address",
    group: "contact",
    type: "text",
    localized: false,
    maxLength: 200,
    label: { en: "Address", no: "Adresse" },
    hint: { en: "Leave empty to hide the row.", no: "La stå tom for å skjule raden." },
  },
  {
    key: "contact.hours",
    group: "contact",
    type: "text",
    localized: true,
    maxLength: 120,
    label: { en: "Opening hours", no: "Åpningstider" },
    hint: { en: "Leave empty to hide the row.", no: "La stå tom for å skjule raden." },
  },
  {
    key: "footer.about",
    group: "footer",
    type: "textarea",
    localized: true,
    maxLength: 400,
    label: { en: "About the bakery", no: "Om bakeriet" },
    hint: {
      en: "The short paragraph in the footer. Leave empty to hide it.",
      no: "Det korte avsnittet i sidefoten. La stå tom for å skjule det.",
    },
  },
] as const satisfies readonly ContentField[];

type Field = (typeof CONTENT_FIELDS)[number];

export type ContentKey = Field["key"];
export type LocalizedContentKey = Extract<Field, { localized: true }>["key"];
export type SharedContentKey = Extract<Field, { localized: false }>["key"];

/** Every key resolved to a string — the shape the public pages read. */
export type SiteContent = Record<ContentKey, string>;

const FIELDS_BY_KEY = new Map<string, ContentField>(
  CONTENT_FIELDS.map((field): [string, ContentField] => [field.key, field]),
);

export function isContentKey(value: string): value is ContentKey {
  return FIELDS_BY_KEY.has(value);
}

export function contentField(key: ContentKey): ContentField {
  const field = FIELDS_BY_KEY.get(key);

  if (!field) throw new Error(`Unknown content field: ${key}`);

  return field;
}

/** Fields of one group, in registry order. */
export function contentFieldsIn(group: ContentGroup): ContentField[] {
  return CONTENT_FIELDS.filter((field) => field.group === group);
}

/** Image keys, used when a replaced upload should be released from R2. */
export const CONTENT_IMAGE_KEYS: string[] = CONTENT_FIELDS.filter(
  (field) => field.type === "image",
).map((field) => field.key);

/**
 * Stable id for one field in one language, e.g. `en.hero.title` for localised
 * copy or `*.brand.logo` for a language-neutral photo.
 */
export function contentFieldId(locale: ContentLocale, key: ContentKey): string {
  return `${locale}.${key}`;
}

/** Form input name understood by `saveContent`, e.g. `content.en.hero.title`. */
export function contentInputName(locale: ContentLocale, key: ContentKey): string {
  return `content.${contentFieldId(locale, key)}`;
}
