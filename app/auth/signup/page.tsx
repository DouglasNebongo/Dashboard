'use client';
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUp() {
  const router = useRouter();

  const handleEmailSignUp = () => {
    router.push("/auth/signup/email");
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-xl md:text-2xl text-white font-bold mb-6 text-center">
        Sign up to get started today!
      </h1>

      {/* google signup button */}
      <button
        onClick={() => signIn("google")}
        className="w-full flex items-center justify-center text-gray-500 border border-gray-300 py-2 px-4 rounded-sm shadow-md hover:bg-blue-400 hover:text-white transition-colors mb-4"
      >
        <FcGoogle className="w-6 h-6 mr-2" />
        <span className="text-lg text-white md:text-xl">Sign up with Google</span>
      </button>

      {/* email sign up button */}
      <button
        onClick={handleEmailSignUp}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 transition duration-300 text-lg md:text-xl"
      >
        Sign up with Email
      </button>

      {/* Sign In Link */}
      <p className="text-white text-lg md:text-xl text-center mt-6">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-white hover:underline  hover:bg-blue-900">
          Sign in
        </Link>
      </p>
    </div>
  );
}