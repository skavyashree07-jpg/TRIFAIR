import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX, BookOpen, MicOff } from "lucide-react";
import { TriangleMotifBand } from "@/components/art/TriangleMotifBand";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Oral Histories & Folk Lore | TRIFAIR" },
      { name: "description", content: "Sacred folklore passed through oral traditions across generations." },
      { property: "og:title", content: "Oral Histories & Folk Lore | TRIFAIR" },
      { property: "og:description", content: "Sacred folklore passed through oral traditions across generations." },
    ],
  }),
  component: StoriesPage,
});

const STORY_KEYS = ["warli", "gond", "dokra", "bodo"] as const;
type StoryKey = (typeof STORY_KEYS)[number];

/** Decorative SVG motifs per story — inline, aria-hidden */
function StoryMotif({ story }: { story: StoryKey }) {
  if (story === "warli") {
    return (
      <svg aria-hidden="true" viewBox="0 0 60 60" className="size-10 text-accent opacity-80" fill="currentColor">
        {/* Warli: two triangle-body figures */}
        <circle cx="20" cy="12" r="5" />
        <polygon points="20,17 14,34 26,34" />
        <circle cx="40" cy="12" r="5" />
        <polygon points="40,17 34,34 46,34" />
        <circle cx="30" cy="45" r="4" opacity="0.5" />
        <line x1="20" y1="25" x2="40" y2="25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (story === "gond") {
    return (
      <svg aria-hidden="true" viewBox="0 0 60 60" className="size-10 text-success opacity-80" fill="currentColor">
        {/* Gond: dots and spirals motif */}
        {[8, 20, 32, 44, 52].map((cx) =>
          [8, 22, 38, 52].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" opacity="0.7" />),
        )}
      </svg>
    );
  }
  if (story === "dokra") {
    return (
      <svg aria-hidden="true" viewBox="0 0 60 60" className="size-10 text-danger opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
        {/* Dokra: wax-coil spiral */}
        <path d="M30 30 C30 20, 45 20, 45 30 C45 45, 15 45, 15 30 C15 12, 50 12, 50 30" />
        <circle cx="30" cy="30" r="4" fill="currentColor" />
      </svg>
    );
  }
  // bodo
  return (
    <svg aria-hidden="true" viewBox="0 0 60 60" className="size-10 text-primary opacity-80" fill="currentColor">
      {/* Bodo: loom geometric */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 11} y="10" width="6" height="40" rx="1" opacity={0.3 + i * 0.15} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="4" y={16 + i * 10} width="52" height="3" rx="1" opacity="0.5" />
      ))}
    </svg>
  );
}

function useSpeechAvailability(lang: string) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAvailable(false);
      return;
    }
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      const prefix = lang.startsWith("hi") ? "hi" : "en";
      setAvailable(voices.some((v) => v.lang.toLowerCase().startsWith(prefix)));
    };
    // Voices may load async
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, [lang]);

  return available;
}

function StoryCard({ storyKey }: { storyKey: StoryKey }) {
  const { t, i18n } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechAvailable = useSpeechAvailability(i18n.language);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const text = t(`stories.${storyKey}StoryText`);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = i18n.language.startsWith("hi") ? "hi-IN" : "en-IN";
    // Prefer matching voice
    const voices = window.speechSynthesis.getVoices();
    const prefix = i18n.language.startsWith("hi") ? "hi" : "en";
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (match) utter.voice = match;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    utteranceRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }, [t, i18n.language, storyKey]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  // Cancel on unmount
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  // Stop if language changes
  useEffect(() => { stop(); }, [i18n.language, stop]);

  const liveId = `story-live-${storyKey}`;

  return (
    <article className="village-wall-card uneven-corners p-6 space-y-4" aria-labelledby={`${storyKey}-title`}>
      <div className="flex items-start gap-4">
        <StoryMotif story={storyKey} />
        <div className="flex-1 min-w-0">
          <h2 id={`${storyKey}-title`} className="font-heading text-xl text-foreground leading-snug">
            {t(`stories.${storyKey}StoryTitle`)}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 italic">{t(`stories.${storyKey}StoryNarrator`)}</p>
        </div>
      </div>

      <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">{t(`stories.${storyKey}StoryText`)}</p>

      {/* Aria-live region for narration status */}
      <div id={liveId} aria-live="polite" aria-atomic="true" className="sr-only">
        {playing ? t("stories.speaking") : ""}
      </div>

      {/* Voice control */}
      {speechAvailable === null ? (
        <p className="text-xs text-muted-foreground animate-pulse">{t("stories.voiceAvailable")}</p>
      ) : speechAvailable === false ? (
        <div role="status" className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <MicOff aria-hidden className="size-4" />
          <span>{t("stories.voiceNotAvailable")}</span>
        </div>
      ) : playing ? (
        <button
          type="button"
          onClick={stop}
          aria-label={`${t("stories.stop")} — ${t(`stories.${storyKey}StoryTitle`)}`}
          className="tap inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
        >
          <VolumeX aria-hidden className="size-4 text-danger" />
          <span>{t("stories.stop")}</span>
          <span className="ml-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={speak}
          aria-label={`${t("stories.listen")} — ${t(`stories.${storyKey}StoryTitle`)}`}
          className="tap inline-flex items-center gap-2 rounded-xl border border-accent/60 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Volume2 aria-hidden className="size-4 text-accent" />
          <span>{t("stories.listen")}</span>
        </button>
      )}
    </article>
  );
}

export function StoriesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      {/* Page header */}
      <section className="village-wall-card uneven-corners-lg p-6 sm:p-10 space-y-4">
        <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center uneven-corners-sm">
          <BookOpen className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground">{t("stories.title")}</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{t("stories.subtitle")}</p>
      </section>

      <TriangleMotifBand height={14} variant="alternating" />

      {/* Story cards */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {STORY_KEYS.map((key) => (
          <StoryCard key={key} storyKey={key} />
        ))}
      </div>
    </div>
  );
}
