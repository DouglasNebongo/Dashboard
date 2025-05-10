'use client';

import { z } from 'zod';
import { SignUpSchema } from "@/app/lib/schemas";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { lusitana } from '@/app/ui/fonts';
import Image from "next/image";
import Link from "next/link";
import AcmeLogo from "@/app/ui/acme-logo";
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface FormData {
  fullName: string;
  email: string;
  password: string;
}

interface FormFieldErrors {
  [key: string]: string;
}

export default function EmailSignUp() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState<FormFieldErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setErrors({}); // Clear previous field errors
    if(isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const formValues = Object.fromEntries(formData);
      const validatedData = SignUpSchema.parse(formValues);
      const { fullName, email, password } = validatedData;

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.reduce((acc: FormFieldErrors, curr) => {
          acc[curr.path[0] as string] = curr.message;
          return acc;
        }, {});
        setErrors(fieldErrors);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center relative min-h-screen">
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
      {/* Blurred Overlay */}
      <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"></div>
      <div className="p-8 w-full max-w-md">
        <h1 className={`${lusitana.className} text-2xl text-white font-bold mb-6 text-center`}>
          Sign Up with Email
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className={`${lusitana.className} block text-sm font-medium text-white`}
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder='Full Name'
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.fullName && <span className="text-red-500">{errors.fullName}</span>}
          </div>

          <div>
            <label
              htmlFor="email"
              className={`${lusitana.className} block text-sm font-medium text-white`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder='Email'
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <span className="text-red-500">{errors.email}</span>}
          </div>

          <div>
            <label
              htmlFor="password"
              className={`${lusitana.className} block text-sm font-medium text-white`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder='Password'
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && <span className="text-red-500">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={`${lusitana.className} w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300`}
          >
            Sign Up
          </button>
        </form>

        {error && (
          <div
            className="mt-4 p-4 bg-red-50 border border-red-200 text-red-500 rounded-lg shadow-sm"
            role="alert"
          >
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
              <strong className="font-semibold mr-1">Error:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}