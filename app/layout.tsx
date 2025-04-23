

import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { SessionProviders } from '@/app/providers';
import { Providers } from '@/app/providers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import { SessionProvider } from "next-auth/react";

import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: {
    template: '%s | Ledger',
    default: 'Ledger',
  },
  description: 'The Financial Ledger',
};






export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}> 
        <Providers>
           {children}
        </Providers>
        </body>
    </html>
  );
}
