"use client";
import { useMemo } from "react";
import { calculateSmsInfo } from "./SmsPreview";

const CHARS_PER_CREDIT = 70;

/**
 * Live character counter for message inputs.
 * Shows: progress bar (filling current credit segment), char count,
 * and credit cost — updates on every keystroke.
 */
export default function MessageCounter({ value, className = "" }) {
  const info = useMemo(() => calculateSmsInfo(value), [value]);
  const chars = info.chars;
  const parts = info.parts;

  // Position within the current 70-char block (1..70)
  const posInBlock = chars === 0 ? 0 : ((chars - 1) % CHARS_PER_CREDIT) + 1;
  const remainingInBlock = CHARS_PER_CREDIT - posInBlock;

  // Color tone scales with credit cost
  const tone =
    parts === 1
      ? { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", fill: "from-emerald-400 to-emerald-500" }
      : parts === 2
      ? { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", fill: "from-blue-400 to-blue-500" }
      : parts <= 4
      ? { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", fill: "from-amber-400 to-amber-500" }
      : { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", fill: "from-red-400 to-red-500" };

  return (
    <div className={`mt-2 ${className}`}>
      {/* Segmented progress bar (1 segment per credit) */}
      <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-transparent">
        {Array.from({ length: Math.max(parts, 1) }).map((_, i) => {
          const isCurrent = i === parts - 1;
          const fillPct = isCurrent
            ? chars === 0
              ? 0
              : (posInBlock / CHARS_PER_CREDIT) * 100
            : 100;
          return (
            <div
              key={i}
              className="relative flex-1 overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${tone.fill} transition-all duration-150`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Counter line */}
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="font-mono font-semibold text-gray-800">{chars}</span>
          <span>chars</span>
          <span className="text-gray-300">·</span>
          <span>
            {chars === 0
              ? "70 characters = 1 credit"
              : remainingInBlock === CHARS_PER_CREDIT
              ? `${CHARS_PER_CREDIT} chars to next credit`
              : `${remainingInBlock} more in this credit`}
          </span>
        </div>
        <span
          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-semibold ${tone.text} ${tone.bg} ${tone.border}`}
        >
          {parts} credit{parts !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
