"use client";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPut } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import HelpSection from "../../components/HelpSection";
import toast from "react-hot-toast";
import { Save, Settings as SettingsIcon, Zap, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["messaging-settings"],
    queryFn: () => msgGet("/settings"),
  });

  const { data: packagesData } = useQuery({
    queryKey: ["messaging-packages"],
    queryFn: () => msgGet("/payment/packages"),
  });

  const packages = packagesData?.data || [];

  useEffect(() => {
    if (settingsData?.data) {
      setSettings({ ...settingsData.data });
    }
  }, [settingsData]);

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await msgPut("/settings", {
      auto_sms_enabled: settings.auto_sms_enabled,
      auto_renew_enabled: settings.auto_renew_enabled,
      auto_renew_package_id: settings.auto_renew_package_id,
      auto_renew_threshold: settings.auto_renew_threshold,
    });
    if (res?.status === 200) {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["messaging-settings"] });
    } else {
      toast.error(res?.message || "Failed to save");
    }
    setSaving(false);
  };

  if (loadingSettings || !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-500/10" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Settings
            </h1>
            <p className="text-sm text-slate-300">
              Configure SMS messaging preferences for your store
            </p>
          </div>
        </div>
      </div>

      {/* Auto-SMS */}
      <SettingCard
        icon={Zap}
        tone="amber"
        title="Auto-SMS on Order Events"
        description="Automatically send SMS when configured order or customer events fire (uses your saved automations)."
        action={
          <Switch
            checked={!!settings.auto_sms_enabled}
            onCheckedChange={(v) => updateField("auto_sms_enabled", v ? 1 : 0)}
          />
        }
        active={!!settings.auto_sms_enabled}
      />

      {/* Auto-Renewal */}
      <SettingCard
        icon={RefreshCw}
        tone="emerald"
        title="Auto-Renewal"
        description="Automatically purchase a new SMS package when credits drop below a threshold."
        action={
          <Switch
            checked={!!settings.auto_renew_enabled}
            onCheckedChange={(v) => updateField("auto_renew_enabled", v ? 1 : 0)}
          />
        }
        active={!!settings.auto_renew_enabled}
      >
        {!!settings.auto_renew_enabled && (
          <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Package to renew
              </label>
              <select
                value={settings.auto_renew_package_id || ""}
                onChange={(e) =>
                  updateField("auto_renew_package_id", Number(e.target.value) || null)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a package</option>
                {packages.map((p) => (
                  <option key={p.package_id} value={p.package_id}>
                    {p.name} — {Number(p.sms_count).toLocaleString()} SMS (৳
                    {Number(p.total_price).toLocaleString()})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-gray-500">
                The package that will be auto-purchased when credits run low.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Renew when credits drop below
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={settings.auto_renew_threshold || 50}
                  onChange={(e) =>
                    updateField("auto_renew_threshold", Number(e.target.value))
                  }
                  min={15}
                  max={1000}
                  className="pr-12"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-gray-400">
                  SMS
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Min 15, max 1000. Triggers a new purchase automatically.
              </p>
            </div>
          </div>
        )}
      </SettingCard>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex justify-end pt-2">
        <div className="rounded-xl bg-white/80 p-1.5 shadow-lg shadow-black/5 backdrop-blur">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <HelpSection />
    </div>
  );
}

const SETTING_TONES = {
  amber: "from-amber-400 to-orange-500",
  emerald: "from-emerald-500 to-teal-500",
  blue: "from-blue-500 to-indigo-500",
  red: "from-red-500 to-rose-500",
};

function SettingCard({ icon: Icon, title, description, tone = "blue", action, active, children }) {
  const grad = SETTING_TONES[tone] || SETTING_TONES.blue;
  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-all hover:shadow-sm ${
        active ? "border-gray-200" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-sm`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {active && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </div>
  );
}
