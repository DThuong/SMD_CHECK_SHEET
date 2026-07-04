import { useEffect, useRef, useState } from "react";
import { getSuggestions, getHighlightSegments } from "../../utils/fuzzySearch";
import { AiOutlineClose } from "react-icons/ai";

interface FuzzySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  candidates: string[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number; 
  inputClassName?: string;   // apply vào <input> (height, border...)
}

export default function FuzzySearchInput({
  value,
  onChange,
  candidates,
  placeholder,
  className = "",
  inputClassName = "",
  maxSuggestions = 8,
}: FuzzySearchInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = getSuggestions(candidates, value, maxSuggestions);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIdx].value);
      setOpen(false);
      setActiveIdx(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`w-full h-[40px] px-3 pr-8 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white ${inputClassName}`}
          placeholder={placeholder}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => { if (value) setOpen(true); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <AiOutlineClose className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((s, i) => {
            const segments = getHighlightSegments(s.value, s.indices);
            return (
              <button
                key={s.value}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(s.value)}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  i === activeIdx
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  s.score > 20 ? "bg-blue-500"
                  : s.score > 10 ? "bg-blue-300"
                  : "bg-gray-300"
                }`} />
                <span>
                  {segments.map((seg, j) =>
                    seg.highlight ? (
                      <mark
                        key={j}
                        className="rounded-sm font-semibold"
                        style={{
                          background: "rgba(59,130,246,0.2)",
                          color: "#2563eb",
                          padding: "0 1px",
                        }}
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={j}>{seg.text}</span>
                    )
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}