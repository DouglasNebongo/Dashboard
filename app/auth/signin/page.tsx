"use client";
import { Suspense } from "react";
import AcmeLogo from "@/app/ui/acme-logo";
import { lusitana } from '@/app/ui/fonts';
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInSchema, SignInFormData } from "@/app/lib/schemas";
import { FcGoogle } from "react-icons/fc";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col p-6 relative overflow-hidden">
      <Link href="/" aria-label="Go to homepage">
        <div className="fixed top-0 left-0 shrink-0 items-end rounded-lg p-4">
          <AcmeLogo />
        </div>
      </Link>
      <div className="fixed inset-0 -z-10">
        <Image
          src="/static/city.png"
          fill
          className="object-cover"   
          alt="Background"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"></div>
      <div className={`${lusitana.className} min-h-screen flex items-center justify-center`}>
        <Suspense fallback={<div>Loading....</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(SignInSchema),
  });

  const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
    setServerError("");
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        router.push(searchParams.get("callbackUrl") || "/dashboard/invoices");
      }
    } catch (error) {
      setServerError(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred"
      );
    }
  };

  return (
    <div className="fixed p-8 rounded-lg w-full max-w-md">
      <h1 className="text-2xl text-white font-bold mb-6 text-center">Sign In</h1>
      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Email"
            {...register("email")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Password"
            {...register("password")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-400 text-white py-2 px-4 rounded-2xl hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="flex items-center justify-center my-4">
        <div className="border-t border-gray-300 flex-grow"></div>
        <span className="mx-4 text-white">OR</span>
        <div className="border-t border-gray-300 flex-grow"></div>
      </div>

      <button
        onClick={() => signIn("google")}
        className="w-full flex items-center justify-center bg-blue-400 text-white border border-gray-300 py-2 px-4 rounded-2xl shadow-md hover:bg-blue-400 hover:text-white transition-colors mb-4"
      >
        <FcGoogle className="w-6 h-6 mr-2" /> 
        Sign in with Google
      </button>

      <div className="mt-4 text-center">
        <Link href="/" className="text-blue-600">
          Don't have an account? <span className="hover:underline">Register</span>
        </Link>
      </div>
    </div>
  );
}