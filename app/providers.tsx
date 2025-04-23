// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from "react";

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function SessionProviders({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function Providers({ children }: { children: React.ReactNode }){

  return (
       <QueryClientProvider client = { queryClient }>
            {children}
       </QueryClientProvider>
  )
   


}
