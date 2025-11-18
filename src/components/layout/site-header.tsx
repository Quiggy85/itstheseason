import Link from "next/link";

const navLinks = [
  { href: "/catalog", label: "Shop" },
  { href: "/account", label: "Account" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold text-zinc-900">
          it&rsquo;s<span className="text-blue-600">the</span>season
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-zinc-600 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/cart"
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          View cart
        </Link>
      </div>
    </header>
  );
}
