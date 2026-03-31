"use client";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPut } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import HelpSection from "../../components/HelpSection";
import toast from "react-hot-toast";
import { Save } from "lucide-react";

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
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await msgPut("/settings", {
            auto_sms_enabled: settings.auto_sms_enabled,
            auto_renew_enabled: settings.auto_renew_enabled,
            auto_renew_package_id: settings.auto_renew_package_id,
            auto_renew_threshold: settings.auto_renew_threshold,
            use_own_provider: settings.use_own_provider,
            provider: settings.provider,
            api_key: settings.api_key,
            sender_id: settings.sender_id,
            provider_endpoint: settings.provider_endpoint,
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
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Settings</h2>
                <p className="text-sm text-gray-500">Configure your SMS messaging preferences</p>
            </div>

            {/* Auto-SMS */}
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-sm">Auto-SMS on Order Events</h3>
                        <p className="text-xs text-gray-500">Automatically send SMS when order events are triggered</p>
                    </div>
                    <Switch checked={!!settings.auto_sms_enabled} onCheckedChange={(v) => updateField("auto_sms_enabled", v ? 1 : 0)} />
                </CardContent>
            </Card>

            {/* Auto-Renewal */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-sm">Auto-Renewal</h3>
                            <p className="text-xs text-gray-500">Automatically purchase a new SMS package when credits run low</p>
                        </div>
                        <Switch checked={!!settings.auto_renew_enabled} onCheckedChange={(v) => updateField("auto_renew_enabled", v ? 1 : 0)} />
                    </div>

                    {!!settings.auto_renew_enabled && (
                        <div className="space-y-3 pl-1">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Package to renew</label>
                                <select
                                    value={settings.auto_renew_package_id || ""}
                                    onChange={(e) => updateField("auto_renew_package_id", Number(e.target.value) || null)}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <option value="">Select a package</option>
                                    {packages.map(p => (
                                        <option key={p.package_id} value={p.package_id}>
                                            {p.name} — {Number(p.sms_count).toLocaleString()} SMS (৳{Number(p.total_price).toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Renew when credits drop below</label>
                                <Input
                                    type="number"
                                    value={settings.auto_renew_threshold || 50}
                                    onChange={(e) => updateField("auto_renew_threshold", Number(e.target.value))}
                                    min={10}
                                    max={1000}
                                    className="w-32"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SMS Provider */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-sm">Use Own SMS Provider</h3>
                            <p className="text-xs text-gray-500">Use your own BulkSMS API credentials instead of the platform default</p>
                        </div>
                        <Switch checked={!!settings.use_own_provider} onCheckedChange={(v) => updateField("use_own_provider", v ? 1 : 0)} />
                    </div>

                    {!!settings.use_own_provider && (
                        <div className="space-y-3 pl-1">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">API Key</label>
                                <Input value={settings.api_key || ""} onChange={(e) => updateField("api_key", e.target.value)} placeholder="Your BulkSMS API key" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Sender ID</label>
                                <Input value={settings.sender_id || ""} onChange={(e) => updateField("sender_id", e.target.value)} placeholder="Sender phone number" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">API Endpoint (optional)</label>
                                <Input value={settings.provider_endpoint || ""} onChange={(e) => updateField("provider_endpoint", e.target.value)} placeholder="https://bulksmsbd.net/api/smsapi" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </div>

            {/* Help */}
            <HelpSection />
        </div>
    );
}
