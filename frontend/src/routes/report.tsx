import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [
    { title: "Report an Issue | TRIFAIR" },
    { name: "description", content: "Demo form for reporting a tag, content, consent, or accessibility concern." },
  ] }),
  component: ReportPage,
});

function ReportPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState("catInaccuracy");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };
  return <div className="space-y-8">
    <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-3">
      <h1 className="font-heading text-4xl sm:text-5xl text-foreground">{t("pages.report.title")}</h1>
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{t("pages.report.body")}</p>
    </section>
    <TriangleMotifBand height={12} variant="alternating" />
    {submitted ? <section role="status" className="village-wall-card uneven-corners p-6 sm:p-8 space-y-3">
      <h2 className="font-heading text-2xl text-foreground">{t("pages.report.successTitle")}</h2>
      <p className="text-muted-foreground">{t("pages.report.successBody")}</p>
      <p className="text-xs font-medium text-muted-foreground border-t border-border pt-3">{t("pages.report.demoNote")}</p>
      <button type="button" onClick={() => { setSubmitted(false); }} className="tap rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{t("pages.report.submit")}</button>
    </section> : <form onSubmit={onSubmit} className="village-wall-card uneven-corners p-6 sm:p-8 space-y-6 max-w-3xl">
      <div className="space-y-2"><label htmlFor="report-category" className="text-sm font-semibold text-foreground">{t("pages.report.categoryLabel")}</label>
        <select id="report-category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-foreground">
          {(["catCounterfeit", "catInaccuracy", "catConsent", "catAccess", "catOther"] as const).map((key) => <option key={key} value={key}>{t(`pages.report.${key}`)}</option>)}
        </select>
      </div>
      <div className="space-y-2"><label htmlFor="report-reference" className="text-sm font-semibold text-foreground">{t("pages.report.tokenLabel")}</label><input id="report-reference" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-foreground" /></div>
      <div className="space-y-2"><label htmlFor="report-description" className="text-sm font-semibold text-foreground">{t("pages.report.descLabel")}</label><textarea id="report-description" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("pages.report.descPlaceholder")} rows={5} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-foreground" /></div>
      <div className="space-y-2"><label htmlFor="report-email" className="text-sm font-semibold text-foreground">{t("pages.report.emailLabel")}</label><input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-3 text-foreground" /></div>
      <p className="text-xs text-muted-foreground">{t("pages.report.demoNote")}</p>
      <button type="submit" className="tap rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{t("pages.report.submit")}</button>
    </form>}
  </div>;
}
