"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { msgPut } from "../lib/api";
import toast from "react-hot-toast";
import { Save, Clock, Zap, XCircle } from "lucide-react";

const GROUP_COLORS = {
  order: "bg-blue-100 text-blue-700",
  customer: "bg-purple-100 text-purple-700",
};

const DELIVERY_MODES = [
  { value: "instant", label: "Instant", icon: Zap },
  { value: "delayed", label: "Delayed", icon: Clock },
  { value: "off", label: "Off", icon: XCircle },
];

export default function AutomationCard({ automation, variables = [], onSaved }) {
  const [isActive, setIsActive] = useState(!!automation.is_active);
  const [deliveryMode, setDeliveryMode] = useState(automation.delivery_mode || "off");
  const [delayMinutes, setDelayMinutes] = useState(automation.delay_minutes || 0);
  const [templateText, setTemplateText] = useState(automation.template_text || "");
  const [saving, setSaving] = useState(false);

  const insertVariable = (varName) => {
    setTemplateText((prev) => prev + `{{${varName}}}`);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await msgPut(`/automations/${automation.automation_id}`, {
      is_active: isActive ? 1 : 0,
      delivery_mode: deliveryMode,
      delay_minutes: deliveryMode === "delayed" ? delayMinutes : 0,
      template_text: templateText,
    });
    if (res?.status === 200) {
      toast.success("Automation saved");
      onSaved?.();
    } else {
      toast.error(res?.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{automation.event_label}</h3>
            <Badge className={`text-[10px] ${GROUP_COLORS[automation.event_group] || ""}`}>
              {automation.event_group}
            </Badge>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {isActive && (
          <>
            {/* Delivery Mode */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Delivery Mode</label>
              <div className="flex gap-2">
                {DELIVERY_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setDeliveryMode(mode.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        deliveryMode === mode.value
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delay input */}
            {deliveryMode === "delayed" && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Delay (minutes)</label>
                <Input
                  type="number"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  min={1}
                  max={1440}
                  className="w-32"
                />
              </div>
            )}

            {/* Template */}
            {deliveryMode !== "off" && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">SMS Template</label>
                <Textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Write your SMS template here..."
                  rows={3}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {variables.map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
