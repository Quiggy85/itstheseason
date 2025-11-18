import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Create your account</h1>
        <p className="text-sm text-zinc-600">
          Join It’s The Season to save addresses, track orders, and get event alerts.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link className="font-medium text-blue-600 hover:text-blue-700" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
}
