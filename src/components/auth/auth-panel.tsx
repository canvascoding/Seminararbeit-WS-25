"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import {
  logout,
  signIn,
  signUp,
  updateUserProfile,
  sendPasswordResetEmail,
  resendVerificationEmail,
  type SignUpPayload,
  type SignInPayload,
} from "@/lib/firebase/auth-client";

type Mode = "signin" | "signup" | "reset";

export function AuthPanel() {
  const t = useTranslations("auth");
  const { firebaseUser, profile, mockMode } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (mode === "signin") {
        const payload: SignInPayload = {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        };
        await signIn(payload);
        setStatus("Erfolgreich angemeldet");
      } else if (mode === "signup") {
        const password = formData.get("password") as string;
        const passwordConfirm = formData.get("passwordConfirm") as string;

        if (password !== passwordConfirm) {
          setError("Passwörter stimmen nicht überein");
          setLoading(false);
          return;
        }

        const payload: SignUpPayload = {
          email: formData.get("email") as string,
          password,
          firstName: formData.get("firstName") as string,
          lastName: formData.get("lastName") as string,
          studyField: formData.get("studyField") as string,
        };
        await signUp(payload);
        setStatus(
          "Account erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse (Webmail wurde geöffnet)."
        );
        form.reset();
      } else if (mode === "reset") {
        const email = formData.get("email") as string;
        await sendPasswordResetEmail(email);
        setStatus(
          "Passwort-Zurücksetzen-E-Mail gesendet! Prüfen Sie Ihr Postfach."
        );
        form.reset();
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const field = issue?.path?.[0];

        // Bei custom validation (z.B. email domain check) verwende die Zod message
        if (issue?.code === "custom") {
          setError(issue.message);
        } else {
          // Für Standard-Validierungen verwende die Feldnachrichten
          const fieldMessages: Record<string, string> = {
            email: t("validationEmail"),
            password: "Passwort muss mindestens 6 Zeichen lang sein",
            firstName: "Vorname muss mindestens 2 Zeichen lang sein",
            lastName: "Nachname muss mindestens 2 Zeichen lang sein",
            studyField: "Studiengang muss mindestens 2 Zeichen lang sein",
          };
          if (typeof field === "string" && fieldMessages[field]) {
            setError(fieldMessages[field]);
          } else {
            setError(issue?.message ?? t("errorGeneric"));
          }
        }
      } else if (err && typeof err === "object" && "message" in err) {
        // Custom error messages from our auth functions
        setError(err.message as string);
      } else if (err && typeof err === "object" && "code" in err) {
        // Firebase Auth Fehler
        const errorCode = (err as { code: string }).code;
        switch (errorCode) {
          case "auth/email-already-in-use":
            setError("Diese E-Mail-Adresse wird bereits verwendet");
            break;
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setError("Falsches Passwort oder ungültige Anmeldedaten");
            break;
          case "auth/user-not-found":
            setError("Benutzer nicht gefunden");
            break;
          case "auth/too-many-requests":
            setError("Zu viele Anfragen. Bitte versuchen Sie es später erneut");
            break;
          default:
            setError(t("errorGeneric"));
        }
      } else {
        setError(t("errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      await resendVerificationEmail();
      setStatus("Bestätigungs-E-Mail erneut gesendet! Prüfen Sie Ihr Postfach.");
    } catch (err) {
      console.error(err);
      if (err && typeof err === "object" && "message" in err) {
        setError(err.message as string);
      } else {
        setError("Fehler beim Senden der Bestätigungs-E-Mail");
      }
    } finally {
      setLoading(false);
    }
  }

  if (mockMode) {
    return (
      <div className="rounded-3xl border border-dashed border-loop-green px-6 py-5 text-sm text-loop-slate/80">
        Firebase Demo-Modus aktiv. Authentifizierung ist lokal deaktiviert.
      </div>
    );
  }

  // Show email verification warning if logged in but not verified
  if (firebaseUser && !firebaseUser.emailVerified) {
    return (
      <div className="rounded-3xl border border-loop-rose/60 bg-loop-rose/10 p-6 shadow-loop-card">
        <h2 className="mb-2 text-lg font-semibold text-loop-slate">
          E-Mail-Adresse nicht bestätigt
        </h2>
        <p className="mb-4 text-sm text-loop-slate/80">
          Bitte bestätigen Sie Ihre E-Mail-Adresse, um die App nutzen zu können.
        </p>
        <p className="mb-4 text-xs text-loop-slate/60">{firebaseUser.email}</p>
        <Button onClick={handleResendVerification} disabled={loading} fullWidth>
          Bestätigungs-E-Mail erneut senden
        </Button>
        <Button
          variant="ghost"
          className="mt-2"
          onClick={() => logout()}
          fullWidth
        >
          Abmelden
        </Button>
        {status && <p className="mt-2 text-xs text-loop-green">{status}</p>}
        {error && <p className="mt-2 text-xs text-loop-rose">{error}</p>}
      </div>
    );
  }

  if (firebaseUser && profile) {
    return (
      <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-loop-card">
        <p className="text-sm text-loop-slate/60">{firebaseUser.email}</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setLoading(true);
            try {
              const firstName = formData.get("firstName") as string;
              const lastName = formData.get("lastName") as string;
              await updateUserProfile({
                uid: profile.uid,
                firstName: firstName || profile.firstName,
                lastName: lastName || profile.lastName,
                displayName:
                  firstName && lastName
                    ? `${firstName} ${lastName}`
                    : profile.displayName,
                studyField:
                  (formData.get("studyField") as string) || profile.studyField,
              });
              setStatus(t("updateProfile"));
            } catch (err) {
              console.error(err);
              setError(t("errorGeneric"));
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input
            name="firstName"
            defaultValue={profile.firstName}
            placeholder="Vorname"
            required
            minLength={2}
          />
          <Input
            name="lastName"
            defaultValue={profile.lastName}
            placeholder="Nachname"
            required
            minLength={2}
          />
          <Input
            name="studyField"
            defaultValue={profile.studyField}
            placeholder={t("studyField")}
            required
            minLength={2}
          />
          <Button disabled={loading}>{t("updateProfile")}</Button>
        </form>
        <Button variant="ghost" className="mt-4" onClick={() => logout()}>
          {t("logout")}
        </Button>
        {status && <p className="mt-2 text-xs text-loop-green">{status}</p>}
        {error && <p className="mt-2 text-xs text-loop-rose">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-loop-card">
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "signin" ? "primary" : "ghost"}
          onClick={() => {
            setMode("signin");
            setError(null);
            setStatus(null);
          }}
          className="flex-1 text-xs sm:text-sm"
        >
          Anmelden
        </Button>
        <Button
          variant={mode === "signup" ? "primary" : "ghost"}
          onClick={() => {
            setMode("signup");
            setError(null);
            setStatus(null);
          }}
          className="flex-1 text-xs sm:text-sm"
        >
          Registrieren
        </Button>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-loop-slate">
        {mode === "signin" && "Anmelden"}
        {mode === "signup" && "Neuen Account erstellen"}
        {mode === "reset" && "Passwort zurücksetzen"}
      </h2>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === "reset" ? (
          <>
            <Input
              name="email"
              type="email"
              placeholder="E-Mail-Adresse"
              required
            />
            <Button type="submit" disabled={loading} fullWidth>
              Passwort zurücksetzen
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode("signin");
                setError(null);
                setStatus(null);
              }}
              fullWidth
            >
              Zurück zur Anmeldung
            </Button>
          </>
        ) : mode === "signin" ? (
          <>
            <Input
              name="email"
              type="email"
              placeholder="E-Mail-Adresse"
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Passwort"
              required
            />
            <Button type="submit" disabled={loading} fullWidth>
              Anmelden
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError(null);
                setStatus(null);
              }}
              className="w-full text-center text-xs text-loop-slate/60 hover:text-loop-slate"
            >
              Passwort vergessen?
            </button>
          </>
        ) : (
          <>
            <Input
              name="email"
              type="email"
              placeholder="E-Mail (@uni-wuppertal.de)"
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Passwort (min. 6 Zeichen)"
              required
              minLength={6}
            />
            <Input
              name="passwordConfirm"
              type="password"
              placeholder="Passwort wiederholen"
              required
              minLength={6}
            />
            <Input
              name="firstName"
              type="text"
              placeholder="Vorname"
              required
              minLength={2}
            />
            <Input
              name="lastName"
              type="text"
              placeholder="Nachname"
              required
              minLength={2}
            />
            <Input
              name="studyField"
              type="text"
              placeholder="Studiengang"
              required
              minLength={2}
            />
            <p className="text-xs text-loop-slate/60">
              Hinweis: Nur E-Mail-Adressen mit @uni-wuppertal.de werden
              akzeptiert.
            </p>
            <Button type="submit" disabled={loading} fullWidth>
              Account erstellen
            </Button>
          </>
        )}
      </form>
      {status && <p className="mt-2 text-xs text-loop-green">{status}</p>}
      {error && <p className="mt-2 text-xs text-loop-rose">{error}</p>}
    </div>
  );
}
