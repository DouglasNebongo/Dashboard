'use client';
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GoogleSignUp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const initiateSignIn = async () => {
      try {
        setLoading(true);
        const result = await signIn("google", { callbackUrl: "/dashboard" });
        if (result?.error) {
          setError(result.error);
        }
      } catch (err) {
        setError("An error occurred during sign-in.");
      } finally {
        setLoading(false);
      }
    };

    initiateSignIn();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {loading ? (
        <p className="text-lg">Redirecting to Google sign-in...</p>
      ) : error ? (
        <p className="text-lg text-red-600">{error}</p>
      ) : null}
    </div>
  );
}