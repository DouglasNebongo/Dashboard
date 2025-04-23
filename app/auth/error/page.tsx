// app/auth/error/page.tsx
"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <Suspense fallback={<div>Loading error details...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: { [key: string]: string } = {
    CredentialsSignin: "Invalid email or password.",
    EmailNotVerified: "Please verify your email before signing in.",
    OAuthAccountNotLinked:
      "This email is already associated with another account. Please sign in with the original provider.",
    default: "An error occurred during authentication. Please try again.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-gray-600 mb-6">{errorMessage}</p>
      <Link
        href="/auth/signin"
        className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Return to Sign In
      </Link>
    </>
  );
}