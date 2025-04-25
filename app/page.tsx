import AcmeLogo from '@/app/ui/acme-logo';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import SignUp from '@/app/auth/signup/page';
import Link from 'next/link';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6 relative overflow-hidden">
      {/* Background Image */}
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

      {/* Logo */}
      <Link href='/'>
        <div className="shrink-0 items-end rounded-lg p-4">
          <AcmeLogo />
        </div>
      </Link>

      {/* Content Section */}
      <div className={`${lusitana.className} flex flex-col md:flex-row flex-1 gap-8 mt-8 md:mt-0`}>
        {/* Left Section - Welcome Message */}
        <div className="flex-1 z-10 flex flex-col justify-center items-center p-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 text-center">
            Welcome to <span className="text-blue-600">Ledger</span>
          </h1>
          <p className="text-lg md:text-2xl text-white text-center max-w-md mb-6">
            Streamline your work and grow your business with ease.
          </p>
          <p className="text-lg md:text-2xl text-white text-center max-w-md">
            Ledger is designed to help you manage clients, track invoices, and analyze earnings. All in one place.
          </p>
        </div>

        {/* Vertical Divider (Hidden on Mobile) */}
        <div className="hidden md:block w-px bg-gray-200"></div>

        {/* Right Section - Sign Up */}
        <div className="flex-1 flex justify-center items-center p-8">
          <SignUp />
        </div>
      </div>
    </main>
  );
}