import Link from "next/link";

const footerLinks = [
  {
    title: "Customer care",
    links: [
      { href: "/support/shipping", label: "Shipping" },
      { href: "/support/returns", label: "Returns" },
      { href: "/support/contact", label: "Contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <Link href="/" className="text-lg font-semibold text-zinc-900">
            it&rsquo;s<span className="text-blue-600">the</span>season
          </Link>
          <p className="mt-3 text-sm text-zinc-600">
            Seasonal must-haves, curated for UK homes all year round.
          </p>
        </div>
        {footerLinks.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-800">
              {section.title}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link className="transition-colors hover:text-zinc-900" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 bg-zinc-100 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} it’s the season. All rights reserved.
      </div>
    </footer>
  );
}
