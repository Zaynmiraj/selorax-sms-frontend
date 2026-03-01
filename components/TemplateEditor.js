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
          <p className="text-xs text-gray-500 mt-1">
            {text.length} chars | {Math.ceil(text.length / 160) || 1} SMS part(s)
          </p>
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
