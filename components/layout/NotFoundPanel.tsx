import Link from "next/link";

/**
 * The 404 body shared by the storefront and the dashboard. Each route group
 * renders it inside its own chrome and points the button at its own home, so a
 * missing product page still has the sidebar and a missing shop page still has
 * the bakery header.
 */
export function NotFoundPanel({
  title,
  body,
  action,
  href,
}: {
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-mocha">{body}</p>
      <Link href={href} className="btn btn-primary mt-8">
        {action}
      </Link>
    </div>
  );
}

