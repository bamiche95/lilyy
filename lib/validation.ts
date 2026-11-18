import { z } from "zod";

import { SUPPORTED_CURRENCIES } from "./currency";
import { LOCALES } from "./i18n";

export const localeSchema = z.enum(LOCALES);
export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const emailSchema = z.email();
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number");

/** Locale/currency switcher — persisted in cookies and on the user record. */
export const preferencesSchema = z.object({
  locale: localeSchema,
  currency: currencySchema,
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;

export const contactTopics = [
  "order",
  "custom-cake",
  "allergens",
  "delivery",
  "general",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  topic: z.enum(contactTopics).default("general"),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(20, "Please add a little more detail").max(4000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const supportMessageSchema = z.object({
  threadId: z.string().min(1).optional(),
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  subject: z.string().trim().min(3).max(120).optional(),
  message: z.string().trim().min(10).max(4000),
});
export type SupportMessageInput = z.infer<typeof supportMessageSchema>;

export const newsletterSchema = z.object({
  email: emailSchema,
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50),
  notes: z.string().trim().max(200).optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  fulfilment: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  deliveryAddress: z.string().trim().max(200).optional(),
  deliveryCity: z.string().trim().max(80).optional(),
  deliveryPostalCode: z.string().trim().max(20).optional(),
  deliveryNotes: z.string().trim().max(1000).optional(),
  preferredDate: z.coerce.date().optional(),
  items: z.array(checkoutItemSchema).min(1, "Your basket is empty"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productFilterSchema = z.object({
  category: z
    .enum(["BREAD", "CAKE", "PASTRY", "COOKIES", "SAVOURY", "SEASONAL", "DRINKS"])
    .optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "newest"]).default("featured"),
});
export type ProductFilterInput = z.infer<typeof productFilterSchema>;

/** Flatten Zod issues into a `{ field: message }` map for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }

  return result;
}
