"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";

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
    } catch (e) {
      setError("Network error during translation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-white uppercase tracking-widest">
          📄 Original Description
        </h2>
        {!translatedText && (
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
            {loading ? "Translating..." : "Translate to English"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
          {error}
        </div>
      )}

      {translatedText ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-semibold">Russian (Original)</h3>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-96">
              {originalText}
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <h3 className="text-[10px] uppercase tracking-wider text-green-400 mb-2 font-semibold">English (Translated)</h3>
            <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-96">
              {translatedText}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {originalText}
        </div>
      )}
    </div>
  );
}
