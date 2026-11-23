import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { SignInForm } from "@/components/auth/SignInForm";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSession } from "@/lib/session";

function safeRedirect(value: string | undefined, lang: string): string {
  if (!value) return `/${lang}`;
  // Prevent open redirects: only same-origin absolute paths.
  return value.startsWith("/") && !value.startsWith("//") ? value : `/${lang}`;
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const session = await getSession();

  if (session?.user) {
    redirect(`/${lang}`);
  }

  const [dict, query] = await Promise.all([getDictionary(lang), searchParams]);
  const redirectTo = safeRedirect(query.next, lang);

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <h1 className="text-3xl">{dict.auth.signInTitle}</h1>
        <p className="mt-2 text-sm text-mocha">{dict.auth.signInSubtitle}</p>

        <div className="card mt-8 p-6 sm:p-8">
          <SignInForm lang={lang} dict={dict.auth} redirectTo={redirectTo} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-cocoa/10" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-mocha">
              {dict.common.or}
            </span>
            <span className="h-px flex-1 bg-cocoa/10" />
          </div>

          <OAuthButtons label={dict.auth.continueWithGoogle} callbackURL={redirectTo} />
        </div>

        <p className="mt-6 text-center text-sm text-mocha">
          {dict.auth.noAccount}{" "}
          <Link
            href={`/${lang}/auth/sign-up`}
            className="font-medium text-cocoa underline underline-offset-4"
          >
            {dict.nav.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
}
