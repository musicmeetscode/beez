"use client";
import { AuthGate } from "@/components/auth-gate";
import { AuthScreen } from "@/components/auth-screen";
import { BusinessSetup } from "@/components/business-setup";
import { Workspace } from "@/components/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { useBusiness } from "@/contexts/business-context";
export default function Page() {
  const { user, loading } = useAuth();
  const { businesses, loading: businessLoading } = useBusiness();
  if (!isFirebaseConfigured) return <AuthGate />;
  if (loading || businessLoading)
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="w-full max-w-md space-y-3 p-6">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      </main>
    );
  if (!user) return <AuthScreen />;
  if (!businesses.length) return <BusinessSetup />;
  return <Workspace />;
}
