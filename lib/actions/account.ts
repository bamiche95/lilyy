"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { fieldErrors, phoneSchema } from "@/lib/validation";

export type ProfileActionState = {
  ok: boolean;
  /** Dictionary key under `account`; `saved` and `invalid` are the ones shown. */
  message?: "saved" | "invalid" | "forbidden" | "error";
  fieldErrors?: Record<string, string>;
};

const inputSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  phone: phoneSchema.optional().or(z.literal("")),
});

/**
 * Customers may edit only the details the bakery actually needs. The email is
 * the sign-in identity (Better Auth owns it), and the role never comes from the
 * client, so neither is read from the form.
 */
export async function updateProfile(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false, message: "forbidden" };
  }

  const lang = String(formData.get("lang") ?? "en").trim() === "no" ? "no" : "en";

  const parsed = inputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: "invalid", fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone?.trim() || null,
      },
    });

    // The desktop trigger and the drawer both print the name, so refresh the
    // shell as well as the page itself.
    revalidatePath("/", "layout");
    revalidatePath(`/${lang}/account`, "layout");

    return { ok: true, message: "saved" };
  } catch (error) {
    console.error("updateProfile failed", error);
    return { ok: false, message: "error" };
  }
}
