"use client";

import { useLanguage } from "@/lib/i18n";

export default function PublicLanguageToggle(): React.JSX.Element {
  const { language, languages, setLanguage } = useLanguage();

  return (
    <div role="group" aria-label={language === "ru" ? "Язык" : "Language"} className="flex shrink-0 items-center rounded-lg border border-field-line bg-white p-0.5">
      {languages.map(({ code, nativeName }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={nativeName}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className="min-h-10 min-w-10 rounded-md px-2 text-xs font-semibold uppercase text-field-muted transition-colors hover:bg-field-raised aria-pressed:bg-field-accent/10 aria-pressed:text-field-accent"
        >
          {code}
        </button>
      ))}
    </div>
  );
}
