"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/" }: AuthGuardProps) {
  const { firebaseUser, loading, mockMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Warte bis Auth-Check abgeschlossen ist
    if (loading) return;

    // Im Mock-Modus nicht weiterleiten (für Development)
    if (mockMode) return;

    // Wenn kein User eingeloggt ist, zur Startseite weiterleiten
    if (!firebaseUser) {
      // Kurze Verzögerung, damit der Nutzer die Info-Nachricht sehen kann
      const timer = setTimeout(() => {
        router.push(redirectTo);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [firebaseUser, loading, mockMode, router, redirectTo]);

  // Zeige Info-Nachricht während Loading oder wenn nicht eingeloggt
  if (loading || (!firebaseUser && !mockMode)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-loop-sand p-4">
        <div className="w-full max-w-md">
          <Alert className="bg-white/90 border-loop-green/20">
            <Info className="h-4 w-4 text-loop-green" />
            <AlertTitle className="text-loop-slate">
              {loading ? "Authentifizierung wird überprüft..." : "Anmeldung erforderlich"}
            </AlertTitle>
            <AlertDescription className="text-loop-slate/70">
              {loading
                ? "Bitte warten Sie einen Moment..."
                : "Sie müssen sich anmelden, um auf diese Funktion zugreifen zu können. Sie werden zur Startseite weitergeleitet..."
              }
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
