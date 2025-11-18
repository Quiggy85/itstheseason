import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Welcome back</h1>
        <p className="text-sm text-zinc-600">
          Sign in to manage your orders, addresses, and payment details.
        </p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-zinc-600">
        New here?{" "}
        <Link className="font-medium text-blue-600 hover:text-blue-700" href="/sign-up">
          Create an account
        </Link>
      </p>
    </div>
  );
}
