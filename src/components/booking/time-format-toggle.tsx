"use client";

interface TimeFormatToggleProps {
  value: "12h" | "24h";
  onChange: (format: "12h" | "24h") => void;
}

export function TimeFormatToggle({ value, onChange }: TimeFormatToggleProps) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-[10px] border border-zinc-200 bg-zinc-100 p-0.5"
      style={{
        boxShadow: "0px 2px 3px 0px rgba(0, 0, 0, 0.03), 0px 2px 2px -1px rgba(0, 0, 0, 0.03)",
      }}>
      <button
        onClick={() => onChange("12h")}
        aria-checked={value === "12h"}
        className={`rounded-lg border border-transparent p-1.5 text-sm leading-none transition ${
          value === "12h"
            ? "bg-white shadow-[0px_2px_3px_0px_rgba(0,0,0,0.03),0px_2px_2px_-1px_rgba(0,0,0,0.03)] text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900"
        }`}>
        12h
      </button>
      <button
        onClick={() => onChange("24h")}
        aria-checked={value === "24h"}
        className={`rounded-lg border border-transparent p-1.5 text-sm leading-none transition ${
          value === "24h"
            ? "bg-white shadow-[0px_2px_3px_0px_rgba(0,0,0,0.03),0px_2px_2px_-1px_rgba(0,0,0,0.03)] text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900"
        }`}>
        24h
      </button>
    </div>
  );
}

