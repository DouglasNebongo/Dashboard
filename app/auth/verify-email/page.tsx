
// app/auth/verify-email/page.tsx
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to your email address. Please check your inbox and click the
          link to verify your email.
        </p>
        <p className="text-gray-600 mb-6">
          If you didn't receive the email, check your spam folder or{" "}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            request a new one
          </Link>
          .
        </p>
        <Link
          href="/auth/signin"
          className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}