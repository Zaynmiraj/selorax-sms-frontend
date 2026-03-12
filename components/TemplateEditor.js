"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { msgPost } from "../lib/api";
import toast from "react-hot-toast";

// GSM-7 charset — anything outside this requires UCS-2 (Unicode) encoding
const GSM7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜa-zäöñüà^{}\\[\]~|€]*$/;

function getSmsInfo(text) {
  if (!text) return { chars: 0, parts: 1, isUnicode: false, limit: 160 };
  const isUnicode = !GSM7_REGEX.test(text);
  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;
  const len = text.length;
  const parts = len <= singleLimit ? 1 : Math.ceil(len / multiLimit);
  return { chars: len, parts, isUnicode, limit: singleLimit };
}

function SmsCounter({ text }) {
  const { chars, parts, isUnicode, limit } = getSmsInfo(text);
  return (
    <p className="text-xs text-gray-500 mt-1">
      {chars} chars | {parts} SMS part(s){" "}
      {isUnicode && <span className="text-amber-600 font-medium">(Unicode — {limit} chars/SMS)</span>}
    </p>
  );
}

const VARIABLES = [
  "order_id",
  "order_number",
  "customer_name",
  "customer_phone",
  "total",
  "status",
  "tracking_id",
  "store_name",
];

const EVENT_LABELS = {
  "order.confirmed": "Order Confirmed",
  "order.shipped": "Order Shipped",
  "order.delivered": "Order Delivered",
  "order.cancelled": "Order Cancelled",
};

export default function TemplateEditor({ template, eventTopic, onSaved }) {
  const [name, setName] = useState(template?.name || EVENT_LABELS[eventTopic] || eventTopic);
  const [text, setText] = useState(template?.template_text || "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [delayMinutes, setDelayMinutes] = useState(template?.delay_minutes || 0);
  const [saving, setSaving] = useState(false);

  const insertVariable = (v) => {
    setText((prev) => prev + `{{${v}}}`);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Template text is required");
      return;
    }
    setSaving(true);
    const res = await msgPost("/templates", {
      event_topic: eventTopic,
      name,
      template_text: text,
      is_active: isActive ? 1 : 0,
      delay_minutes: Number(delayMinutes) || 0,
    });

    if (res?.status === 200) {
      toast.success("Template saved");
      onSaved?.();
    } else {
      toast.error(res?.message || "Failed to save template");
    }
    setSaving(false);
  };

  // Preview with sample data
  const preview = text
    .replace(/\{\{order_id\}\}/g, "1234")
    .replace(/\{\{order_number\}\}/g, "#ORD-1234")
    .replace(/\{\{customer_name\}\}/g, "John Doe")
    .replace(/\{\{customer_phone\}\}/g, "01712345678")
    .replace(/\{\{total\}\}/g, "1,500")
    .replace(/\{\{status\}\}/g, "Confirmed")
    .replace(/\{\{tracking_id\}\}/g, "TRK-5678")
    .replace(/\{\{store_name\}\}/g, "My Store");

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{EVENT_LABELS[eventTopic] || eventTopic}</h3>
            <p className="text-xs text-gray-500">{eventTopic}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Active</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Send delay:</span>
          <Input
            type="number"
            min={0}
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            className="w-20 text-sm h-8"
          />
          <span className="text-xs text-gray-400">minutes (0 = immediate)</span>
        </div>

        <Input
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm"
        />

        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {VARIABLES.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 text-xs"
                onClick={() => insertVariable(v)}
              >
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>
          <Textarea
            placeholder="Type your SMS template here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <SmsCounter text={text} />
        </div>

        {text && (
          <div className="rounded-md bg-gray-50 p-2 text-sm text-gray-700">
            <p className="text-xs font-medium text-gray-500 mb-1">Preview:</p>
            {preview}
          </div>
        )}

        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </CardContent>
    </Card>
  );
}
