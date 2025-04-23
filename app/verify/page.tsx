'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function VerifyPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
      <Suspense fallback={<div>Loading verification details...</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    const result = await signIn('credentials', {
      email,
      code,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      alert('Invalid verification code');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <p className="mb-4">We've sent a 6-digit code to {email}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
          className="w-full p-2 border rounded"
          maxLength={6}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>
    </>
  );
}