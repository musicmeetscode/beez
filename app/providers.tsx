"use client";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { BusinessProvider } from "@/contexts/business-context";
import { WebMCPTools } from "@/components/webmcp-tools";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BusinessProvider>
        {children}
        <WebMCPTools />
        <Toaster richColors position="top-right" />
      </BusinessProvider>
    </AuthProvider>
  );
}
