"use client";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { BusinessProvider } from "@/contexts/business-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { WebMCPTools } from "@/components/webmcp-tools";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>
        <CurrencyProvider>
          {children}
          <WebMCPTools />
          <PwaRegister />
          <Toaster richColors position="top-right" />
        </CurrencyProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}
