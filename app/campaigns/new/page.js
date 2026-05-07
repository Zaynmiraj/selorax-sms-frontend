"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { msgGet, msgPost } from "../../../lib/api";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import AudienceSelector from "../../../components/AudienceSelector";
import SmsPreview, { calculateSmsInfo } from "../../../components/SmsPreview";
import MessageCounter from "../../../components/MessageCounter";
import toast from "react-hot-toast";
import { Send, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCampaignPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [phones, setPhones] = useState([]);
    const [audienceType, setAudienceType] = useState("manual");
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState("");
    const [creating, setCreating] = useState(false);

    const { data: walletData } = useQuery({
        queryKey: ["messaging-wallet"],
        queryFn: () => msgGet("/wallet"),
    });

    const credits = walletData?.data?.sms_credits || 0;
    const { parts, isUnicode } = calculateSmsInfo(message);
    const totalCredits = phones.length * parts;

    const handlePhonesChange = (phoneList, type) => {
        setPhones(phoneList);
        setAudienceType(type);
    };

    const handleCreate = async () => {
        if (!name.trim()) { toast.error("Campaign name is required"); return; }
        if (!message.trim()) { toast.error("Message is required"); return; }
        if (phones.length === 0) { toast.error("Add at least one phone number"); return; }
        if (totalCredits > credits) { toast.error(`Not enough credits. Need ${totalCredits}, have ${credits}`); return; }

        setCreating(true);
        const res = await msgPost("/campaigns", {
            name: name.trim(),
            message: message.trim(),
            audience_type: audienceType,
            phones,
            scheduled_at: scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        });

        if (res?.status === 200) {
            toast.success("Campaign created!");
            router.push("/campaigns");
        } else {
            toast.error(res?.message || "Failed to create campaign");
        }
        setCreating(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/campaigns">
                    <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h2 className="text-lg font-semibold">New Campaign</h2>
                    <p className="text-sm text-gray-500">Send bulk SMS to your customers</p>
                </div>
            </div>

            {/* Campaign Name */}
            <Card>
                <CardContent className="p-4">
                    <label className="text-sm font-medium mb-1 block">Campaign Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Year Sale Announcement" />
                </CardContent>
            </Card>

            {/* Audience */}
            <Card>
                <CardContent className="p-4">
                    <label className="text-sm font-medium mb-3 block">Audience</label>
                    <AudienceSelector onPhonesChange={handlePhonesChange} />
                </CardContent>
            </Card>

            {/* Message + Live Preview */}
            <Card>
                <CardContent className="p-4">
                    <label className="text-sm font-medium mb-1 block">Message</label>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your SMS message..."
                                rows={5}
                            />
                            <MessageCounter value={message} />
                        </div>
                        <SmsPreview
                            text={message}
                            note={`This exact message will be sent to all ${phones.length || 0} recipients.`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <label className="text-sm font-medium">Schedule for later</label>
                        </div>
                        <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} className="rounded" />
                    </div>
                    {scheduleEnabled && (
                        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{phones.length}</p>
                            <p className="text-xs text-gray-500">Recipients</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalCredits}</p>
                            <p className="text-xs text-gray-500">Credits needed</p>
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${totalCredits > credits ? "text-red-500" : "text-green-600"}`}>{credits}</p>
                            <p className="text-xs text-gray-500">Credits available</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create */}
            <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={creating || phones.length === 0}>
                    <Send className="h-4 w-4 mr-1" />
                    {creating ? "Creating..." : scheduleEnabled ? "Schedule Campaign" : "Create & Send"}
                </Button>
            </div>
        </div>
    );
}
