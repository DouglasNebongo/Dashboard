'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SideNav from '@/app/ui/dashboard/sidenav';
import MenuButton from '@/app/ui/menuButton';
import AcmeLogo from '@/app/ui/acme-logo';

function useToggleMenu() {
  const [menuShow, setMenuShow] = useState(false);

  const onMenuToggle = () => {
    setMenuShow((status) => !status);
  };

  useEffect(() => {
    if (menuShow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [menuShow]);

  return [menuShow, onMenuToggle] as const;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuShow, onMenuToggle] = useToggleMenu();

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      {/* Desktop SideNav */}
      <div className="hidden md:block w-full flex-none md:w-64">
        <SideNav />
      </div>

      {/* Mobile Header - Menu Button and Logo */}
      <div className="md:hidden w-full bg-blue-600 flex items-center p-4">
        {/* Menu Button */}
        <div className="mr-4">
          <MenuButton
            onClick={onMenuToggle}
            isOpened={menuShow}
            aria-label="Toggle menu"
          />
        </div>

        {/* Logo */}
        <div className="flex-grow flex justify-center">
          <Link href="/">
            <div className="shrink-0">
              <AcmeLogo />
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile SideNav (conditionally rendered) */}
      {menuShow && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={onMenuToggle}
          role="dialog"
          aria-modal="true"
          aria-expanded={menuShow}
        >
          <div className="w-64 h-full bg-white">
            <SideNav />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}