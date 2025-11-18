import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerSession } from "@/lib/auth/get-session";

export default async function AccountPage() {
  const { user } = await getServerSession();

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Hi, {user?.user_metadata?.full_name ?? "there"} 👋</h1>
          <p className="text-sm text-zinc-600">
            Manage your account details, saved addresses, and order history.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Profile &amp; preferences</h2>
            <p className="text-sm text-zinc-600">
              Update your name, email preferences, and marketing opt-ins.
            </p>
          </div>
          <Link
            href="/account/profile"
            className="mt-4 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage profile
          </Link>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Addresses</h2>
            <p className="text-sm text-zinc-600">
              Keep your delivery destinations up to date for smooth drop-offs.
            </p>
          </div>
          <Link
            href="/account/addresses"
            className="mt-4 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Manage addresses
          </Link>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">Orders &amp; billing</h2>
            <p className="text-sm text-zinc-600">
              Check order status, download invoices, and manage payment methods.
            </p>
          </div>
          <Link
            href="/account/orders"
            className="mt-4 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View orders
          </Link>
        </section>
      </div>
    </div>
  );
}
