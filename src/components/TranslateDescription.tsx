"use client";

import { useState } from "react";
import { Languages, Loader2, FileText } from "lucide-react";

export default function TranslateDescription({ originalText }: { originalText: string }) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (translatedText) return; // already translated
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedText(data.text);
      } else {
        setError(data.error || "Translation failed");
      }
    } catch {
      setError("Network error during translation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 flex flex-col backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          <FileText size={13} className="text-zinc-400" />
          Original Description
        </h2>
        {!translatedText && (
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
            {loading ? "Translating..." : "Translate to English"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      {translatedText ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Russian (Original)</h3>
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-96">
              {originalText}
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <h3 className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2 font-semibold">English (Translated)</h3>
            <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-96">
              {translatedText}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {originalText}
        </div>
      )}
    </div>
  );
}
