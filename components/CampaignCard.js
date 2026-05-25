"use client";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { Send, X, Eye, Users, MessageSquare, Target } from "lucide-react";
import { audienceLabel } from "../lib/audience";

const STATUS_COLORS = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    sending: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

export default function CampaignCard({ campaign, onAction }) {
    const progress = campaign.total_recipients > 0
        ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
        : 0;
    const canSend = campaign.status === "draft" || campaign.status === "scheduled";

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-medium text-sm">{campaign.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{campaign.message}</p>
                    </div>
                    <Badge className={`text-[10px] ${STATUS_COLORS[campaign.status] || ""}`}>
                        {campaign.status}
                    </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 flex-wrap">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{audienceLabel(campaign)}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.total_recipients} recipients</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{campaign.sent_count} sent</span>
                    {campaign.failed_count > 0 && (
                        <span className="text-red-500">{campaign.failed_count} failed</span>
                    )}
                </div>

                {/* Progress bar (if sending) */}
                {campaign.status === "sending" && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* Date */}
                <p className="text-[10px] text-gray-400 mb-3">
                    {campaign.scheduled_at
                        ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleString("en-BD")}`
                        : `Created: ${new Date(campaign.created_at).toLocaleString("en-BD")}`}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link href={`/campaigns/${campaign.campaign_id}`}>
                        <Button variant="outline" size="sm"><Eye className="h-3 w-3 mr-1" />View</Button>
                    </Link>
                    {canSend && (
                        <>
                            <Button size="sm" onClick={() => onAction?.("send", campaign.campaign_id)}>
                                <Send className="h-3 w-3 mr-1" />Send Now
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onAction?.("cancel", campaign.campaign_id)}>
                                <X className="h-3 w-3 mr-1" />Cancel
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
