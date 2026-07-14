"use client";
import { useMemo } from "react";
import { MessageSquare } from "lucide-react";

// GSM-7 character set — used for the encoding badge. Billing is flat per
// CHARS_PER_CREDIT regardless of encoding, but we still show the user whether
// their message will be sent as Unicode (Bangla/emoji) or GSM-7.
const GSM7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜa-zäöñüà^{}\\[\]~|€]*$/;

// Must stay in sync with selorax-messaging/models/messaging.js.
const CHARS_PER_CREDIT = 70;

// Sample values for automation template previews. Kept here so every preview
// shows the same fake data and merchants build an intuition for it.
export const SAMPLE_VALUES = {
  order_id: "1024",
  order_number: "ORD-1024",
  customer_name: "Rahim Uddin",
  customer_phone: "01712345678",
  customer_email: "rahim@example.com",
  total: "1,250",
  grand_total: "1,250",
  status: "cancelled",
  tracking_id: "SFD-78291",
  store_name: "My Store",
  pay_link: "https://mystore.com/pay/a1b2c3",
  outstanding_amount: "760",
  gateway: "shurjopay",
};

export function renderTemplate(text, values = {}) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (values[key] !== undefined) return String(values[key]);
    return `{{${key}}}`;
  });
}

export function calculateSmsInfo(message) {
  if (!message) return { chars: 0, parts: 1, isUnicode: false };
  const isUnicode = !GSM7_REGEX.test(message);
  const len = message.length;
  // Flat billing: 1 credit per 70 characters, regardless of encoding.
  const parts = Math.max(1, Math.ceil(len / CHARS_PER_CREDIT));
  return { chars: len, parts, isUnicode };
}

/**
 * Live SMS preview with phone-style bubble + char/part counter.
 *
 * Props:
 *   - text: raw message (may contain {{variable}} placeholders)
 *   - values: optional map to substitute {{var}} → value. Defaults to {} (no substitution).
 *   - senderLabel: header text shown above the bubble (defaults to sample store name)
 *   - note: optional caption under the bubble
 *   - compact: shrink padding for tight layouts
 */
export default function SmsPreview({
  text = "",
  values,
  senderLabel,
  note,
  compact = false,
}) {
  const rendered = useMemo(() => renderTemplate(text, values || {}), [text, values]);
  const info = useMemo(() => calculateSmsInfo(rendered), [rendered]);
  const label = senderLabel || (values?.store_name ?? SAMPLE_VALUES.store_name);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">Live Preview</label>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className={info.isUnicode ? "text-purple-600 font-medium" : ""}>
            {info.isUnicode ? "Unicode" : "GSM-7"}
          </span>
          <span>•</span>
          <span>{info.chars} chars</span>
          <span>•</span>
          <span className={info.parts > 1 ? "text-amber-600 font-medium" : ""}>
            {info.parts} part{info.parts > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div
        className={`rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 ${
          compact ? "p-2.5 min-h-[110px]" : "p-3 min-h-[130px]"
        } flex flex-col`}
      >
        <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-400">
          <MessageSquare className="h-3 w-3" />
          <span>{label}</span>
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm max-w-[90%] self-start">
          <p className="text-[12px] text-gray-900 whitespace-pre-wrap break-words leading-snug">
            {rendered || (
              <span className="text-gray-300 italic">
                Your SMS preview will appear here…
              </span>
            )}
          </p>
        </div>
      </div>

      {note && <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">{note}</p>}
    </div>
  );
}
