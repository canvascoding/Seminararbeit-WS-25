"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";

export function ReportForm() {
  const t = useTranslations("safety");
  const { firebaseUser } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebaseUser) {
      setError("Bitte zuerst anmelden.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": firebaseUser.uid,
        },
        body: JSON.stringify({
          loopId: formData.get("loopId"),
          type: formData.get("type"),
          description: formData.get("description"),
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler");
      }

      setStatus(t("success"));
      event.currentTarget.reset();
    } catch (err) {
      console.error(err);
      setError("Meldung konnte nicht gesendet werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="loopId" placeholder={t("loopId")} required />
      <select
        name="type"
        className="w-full rounded-2xl border border-loop-slate/15 bg-white px-4 py-3 text-sm text-loop-slate"
        defaultValue="safety"
      >
        <option value="safety">{t("options.safety")}</option>
        <option value="noShow">{t("options.noShow")}</option>
        <option value="other">{t("options.other")}</option>
      </select>
      <Textarea
        name="description"
        placeholder={t("description")}
        minLength={20}
        maxLength={500}
        rows={5}
        required
      />
      <Button type="submit" disabled={loading} fullWidth>
        {t("submit")}
      </Button>
      {status && <p className="text-sm text-loop-green">{status}</p>}
      {error && <p className="text-sm text-loop-rose">{error}</p>}
    </form>
  );
}
