'use client';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from "next-auth/react";

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2 relative">
      {/* Mobile Header with Sign Out */}
      <div className="md:hidden flex justify-between items-center mb-2 h-16">
        <Link
          className="h-full flex items-center rounded-md bg-blue-600 p-4 flex-1"
          href="/"
        >
          <div className="w-32 text-white">
            <AcmeLogo />
          </div>
        </Link>
        <button
          onClick={() => signOut()}
          className="ml-2 flex h-[48px] w-[48px] items-center justify-center rounded-md bg-gray-50 p-2 hover:bg-sky-100 hover:text-blue-600"
        >
          <PowerIcon className="w-6" />
        </button>
      </div>

      {/* Desktop Logo */}
      <Link
        className="hidden md:flex mb-2 h-40 items-end justify-start rounded-md bg-blue-600 p-4"
        href="/"
      >
        <div className="w-40 text-white">
          <AcmeLogo />
        </div>
      </Link>

      <div className="flex grow flex-col justify-between md:justify-normal">
        <div className="flex flex-col space-y-2">
          {/* Scrollable Navigation */}
          <div className="overflow-x-auto md:overflow-visible">
            <div className="flex min-w-max flex-row gap-2 md:flex-col md:gap-0">
              <NavLinks />
            </div>
          </div>
          
          {/* Desktop Spacer */}
          <div className="hidden h-full rounded-md bg-gray-50 md:block"></div>
        </div>

        {/* Desktop Sign Out */}
        <button
          onClick={() => signOut()}
          className="hidden md:flex h-[48px] items-center justify-start gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600"
        >
          <PowerIcon className="w-6 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}