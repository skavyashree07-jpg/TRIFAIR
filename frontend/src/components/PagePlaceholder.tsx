import { useTranslation } from "react-i18next";
import { BookOpen, CheckCircle2, ShieldCheck, Scale, Info } from "lucide-react";

const CONTENT: Record<string, { intro?: string; sections: { title: string; body: string; icon?: "book" | "check" | "shield" | "scale" | "info" }[] }> = {
  about: { intro: "lead", sections: [
    { title: "missionTitle", body: "pillar1Desc", icon: "book" },
    { title: "pillar2Title", body: "pillar2Desc", icon: "check" },
    { title: "pillar3Title", body: "pillar3Desc", icon: "scale" },
    { title: "disclaimerTitle", body: "disclaimerDesc", icon: "info" },
  ] },
  sources: { intro: "lead", sections: [
    { title: "archivesTitle", body: "archivesDesc", icon: "book" },
    { title: "giTitle", body: "giDesc", icon: "check" },
    { title: "disclaimerTitle", body: "disclaimerDesc", icon: "info" },
  ] },
  consent: { intro: "lead", sections: [
    { title: "principle1Title", body: "principle1Desc", icon: "shield" },
    { title: "principle2Title", body: "principle2Desc", icon: "check" },
    { title: "principle3Title", body: "principle3Desc", icon: "info" },
  ] },
  privacy: { intro: "lead", sections: [
    { title: "storageTitle", body: "storageDesc", icon: "info" },
    { title: "noBackendTitle", body: "noBackendDesc", icon: "shield" },
    { title: "clearTitle", body: "clearDesc", icon: "check" },
  ] },
  help: { sections: [
    { title: "faq1Q", body: "faq1A", icon: "info" },
    { title: "faq2Q", body: "faq2A", icon: "check" },
    { title: "faq3Q", body: "faq3A", icon: "scale" },
    { title: "faq4Q", body: "faq4A", icon: "shield" },
  ] },
  methodology: { sections: [
    { title: "pricingSection", body: "pricingText", icon: "scale" },
    { title: "provenanceSection", body: "provenanceText", icon: "check" },
    { title: "consentSection", body: "consentText", icon: "shield" },
    { title: "dataTitle", body: "dataText", icon: "info" },
  ] },
};

function SectionIcon({ icon }: { icon?: string }) {
  const className = "size-5 text-primary shrink-0";
  if (icon === "book") return <BookOpen className={className} aria-hidden="true" />;
  if (icon === "check") return <CheckCircle2 className={className} aria-hidden="true" />;
  if (icon === "shield") return <ShieldCheck className={className} aria-hidden="true" />;
  if (icon === "scale") return <Scale className={className} aria-hidden="true" />;
  return <Info className={className} aria-hidden="true" />;
}

export function PagePlaceholder({ page, vars }: { page: string; vars?: Record<string, string> }) {
  const { t } = useTranslation();
  const content = CONTENT[page];
  return (
    <div className="space-y-8">
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">{t(`pages.${page}.title`)}</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl">{t(`pages.${page}.body`, vars ?? {})}</p>
        {content?.intro && <p className="text-base leading-relaxed text-foreground/90 max-w-3xl">{t(`pages.${page}.${content.intro}`)}</p>}
      </section>
      {content && <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {content.sections.map((section) => (
          <article key={section.title} className="village-wall-card uneven-corners p-6 sm:p-7 space-y-3">
            <div className="flex items-center gap-3"><SectionIcon icon={section.icon} /><h2 className="font-heading text-xl text-foreground">{t(`pages.${page}.${section.title}`)}</h2></div>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{t(`pages.${page}.${section.body}`)}</p>
          </article>
        ))}
      </div>}
    </div>
  );
}
