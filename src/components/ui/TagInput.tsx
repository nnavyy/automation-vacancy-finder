"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { searchCatalog } from "@/lib/catalog/search";
import type { CatalogItem } from "@/lib/catalog/data";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  catalog?: CatalogItem[];
  placeholder?: string;
  hint?: string;
  maxSuggestions?: number;
  id?: string;
}

/**
 * Chip input with catalog autocomplete.
 * Enter/Tab/comma add (the highlighted suggestion if any, otherwise the typed text),
 * Backspace on empty input removes the last chip, ArrowUp/Down navigate suggestions.
 */
export default function TagInput({
  label,
  value,
  onChange,
  catalog = [],
  placeholder,
  hint,
  maxSuggestions = 8,
  id,
}: TagInputProps) {
  const autoId = useId();
  const baseId = id ?? `tag-${autoId.replace(/:/g, "")}`;
  const listId = `${baseId}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const suggestions = useMemo(
    () => searchCatalog(catalog, text, { limit: maxSuggestions, exclude: value }),
    [catalog, text, value, maxSuggestions]
  );

  useEffect(() => {
    setActive(0);
  }, [text]);

  const addTags = (raw: string | string[]) => {
    const items = (Array.isArray(raw) ? raw : [raw])
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const existing = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    for (const it of items) {
      if (!existing.has(it.toLowerCase())) {
        existing.add(it.toLowerCase());
        next.push(it);
      }
    }
    if (next.length !== value.length) onChange(next);
    setText("");
    setOpen(false);
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const commit = () => {
    if (open && suggestions.length > 0 && suggestions[active]) {
      addTags(suggestions[active]);
    } else {
      addTags(text);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (suggestions.length ? (a + 1) % suggestions.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (suggestions.length ? (a - 1 + suggestions.length) % suggestions.length : 0));
    } else if (e.key === "Enter") {
      if (text.trim()) {
        e.preventDefault();
        commit();
      }
    } else if (e.key === "Tab") {
      if (text.trim()) {
        e.preventDefault();
        commit();
      }
    } else if (e.key === ",") {
      e.preventDefault();
      addTags(text);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",") || pasted.includes("\n")) {
      e.preventDefault();
      addTags(pasted.split(/[,\n]/));
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative">
      <label
        htmlFor={baseId}
        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>

      <div
        onClick={() => inputRef.current?.focus()}
        className="flex flex-wrap items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 min-h-[38px] focus-within:border-emerald-500/60 transition-colors cursor-text"
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-100 text-xs rounded-md pl-2 pr-1 py-0.5 border border-zinc-700"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={baseId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${baseId}-opt-${active}` : undefined}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay so a click on a suggestion registers first.
            setTimeout(() => {
              setOpen(false);
            }, 120);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none py-1"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${baseId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                addTags(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-1.5 text-xs cursor-pointer ${
                i === active ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-300"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="text-[10px] text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}
