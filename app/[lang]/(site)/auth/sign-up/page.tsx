import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export default async function SignUpPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const session = await getSession();

  if (session?.user) {
    redirect(`/${lang}`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="container-page flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md">
        <h1 className="text-3xl">{dict.auth.signUpTitle}</h1>
        <p className="mt-2 text-sm text-mocha">{dict.auth.signUpSubtitle}</p>

        <div className="card mt-8 p-6 sm:p-8">
          <SignUpForm lang={lang} dict={dict.auth} />

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-cocoa/10" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-mocha">
              {dict.common.or}
            </span>
            <span className="h-px flex-1 bg-cocoa/10" />
          </div>

          <OAuthButtons label={dict.auth.continueWithGoogle} callbackURL={`/${lang}`} />
        </div>

        <p className="mt-6 text-center text-sm text-mocha">
          {dict.auth.haveAccount}{" "}
          <Link
            href={`/${lang}/auth/sign-in`}
            className="font-medium text-cocoa underline underline-offset-4"
          >
            {dict.nav.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
