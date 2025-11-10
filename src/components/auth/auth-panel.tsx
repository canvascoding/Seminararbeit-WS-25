"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";
import { MAGIC_LINK_EMAIL_KEY } from "@/lib/constants";
import {
  logout,
  sendMagicLink,
  signIn,
  signUp,
  updateUserProfile,
} from "@/lib/firebase/auth-client";

type Mode = "signin" | "signup" | "magic";

export function AuthPanel() {
  const t = useTranslations("auth");
  const { firebaseUser, profile, mockMode } = useAuth();
  const [mode, setMode] = useState<Mode>("magic");
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
        await signIn(
          formData.get("email") as string,
          formData.get("password") as string,
        );
        setStatus("angemeldet");
      } else if (mode === "signup") {
        await signUp({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          name: formData.get("name") as string,
        });
        setStatus(t("successSignup"));
      } else {
        const email = formData.get("email") as string;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
        }
        await sendMagicLink(email);
        setStatus(t("successMagic"));
      }
      form.reset();
    } catch (err) {
      console.error(err);
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const field = issue?.path?.[0];
        const fieldMessages: Record<string, string> = {
          email: t("validationEmail"),
          password: t("validationPassword"),
          name: t("validationName"),
        };
        if (typeof field === "string" && fieldMessages[field]) {
          setError(fieldMessages[field]);
        } else {
          setError(issue?.message ?? t("errorGeneric"));
        }
      } else if (err && typeof err === "object" && "code" in err) {
        // Firebase Auth Fehler
        const errorCode = (err as { code: string }).code;
        switch (errorCode) {
          case "auth/email-already-in-use":
            setError(t("errorEmailInUse"));
            break;
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setError(t("errorWrongPassword"));
            break;
          case "auth/user-not-found":
            setError(t("errorUserNotFound"));
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

  if (mockMode) {
    return (
      <div className="rounded-3xl border border-dashed border-loop-green px-6 py-5 text-sm text-loop-slate/80">
        Firebase Demo-Modus aktiv. Authentifizierung ist lokal deaktiviert.
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
              await updateUserProfile({
                uid: profile.uid,
                displayName: (formData.get("name") as string) ?? profile.displayName,
                studyField: (formData.get("studyField") as string) || undefined,
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
            name="name"
            defaultValue={profile.displayName}
            placeholder={t("name")}
          />
          <Input
            name="studyField"
            defaultValue={profile.studyField}
            placeholder={t("studyField")}
          />
          <Button disabled={loading}>{t("updateProfile")}</Button>
        </form>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => logout()}
        >
          {t("logout")}
        </Button>
        {status && <p className="mt-2 text-xs text-loop-green">{status}</p>}
        {error && <p className="mt-2 text-xs text-loop-rose">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-white/60 bg-white/80 p-4 sm:p-6 shadow-loop-card">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={mode === "magic" ? "primary" : "ghost"}
          onClick={() => setMode("magic")}
          className="flex-1 min-w-[100px] text-xs sm:text-sm px-3 sm:px-4"
        >
          <span className="hidden min-[400px]:inline">Magic Link</span>
          <span className="min-[400px]:hidden">Magic</span>
        </Button>
        <Button
          variant={mode === "signin" ? "primary" : "ghost"}
          onClick={() => setMode("signin")}
          className="flex-1 min-w-[100px] text-xs sm:text-sm px-3 sm:px-4"
        >
          {t("signIn")}
        </Button>
        <Button
          variant={mode === "signup" ? "primary" : "ghost"}
          onClick={() => setMode("signup")}
          className="flex-1 min-w-[100px] text-xs sm:text-sm px-3 sm:px-4"
        >
          {t("signUp")}
        </Button>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        {(mode === "signin" || mode === "signup" || mode === "magic") && (
          <Input name="email" type="email" placeholder={t("email")} required />
        )}
        {(mode === "signin" || mode === "signup") && (
          <Input
            name="password"
            type="password"
            minLength={10}
            placeholder={t("password")}
            required
          />
        )}
        {mode === "signup" && (
          <>
            <Input name="name" placeholder={t("name")} required />
          </>
        )}
        <Button type="submit" disabled={loading} fullWidth>
          {mode === "signin"
            ? t("signIn")
            : mode === "signup"
              ? t("signUp")
              : t("magicLink")}
        </Button>
      </form>
      {status && <p className="mt-2 text-xs text-loop-green">{status}</p>}
      {error && <p className="mt-2 text-xs text-loop-rose">{error}</p>}
    </div>
  );
}
