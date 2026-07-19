"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPost } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import CampaignCard from "@/components/CampaignCard";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, MessageSquare } from "lucide-react";

export default function CampaignsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["messaging-campaigns", page],
        queryFn: () => msgGet("/campaigns", { page, limit: 20 }),
    });

    const campaigns = data?.data?.campaigns || [];
    const total = data?.data?.total || 0;

    const handleAction = async (action, campaignId) => {
        if (action === "send") {
            const res = await msgPost(`/campaigns/${campaignId}/send`);
            if (res?.status === 200) {
                toast.success("Campaign sending started");
                queryClient.invalidateQueries({ queryKey: ["messaging-campaigns"] });
                queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] });
            } else {
                toast.error(res?.message || "Failed to start");
            }
        } else if (action === "cancel") {
            const res = await msgPost(`/campaigns/${campaignId}/cancel`);
            if (res?.status === 200) {
                toast.success("Campaign cancelled");
                queryClient.invalidateQueries({ queryKey: ["messaging-campaigns"] });
                queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] });
            } else {
                toast.error(res?.message || "Failed to cancel");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Campaigns</h2>
                    <p className="text-sm text-gray-500">Send bulk SMS to your customers</p>
                </div>
                <Link href="/campaigns/new">
                    <Button><Plus className="h-4 w-4 mr-1" />New Campaign</Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No campaigns yet</p>
                    <Link href="/campaigns/new">
                        <Button variant="outline" className="mt-3">Create your first campaign</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {campaigns.map(c => (
                            <CampaignCard key={c.campaign_id} campaign={c} onAction={handleAction} />
                        ))}
                    </div>
                    {total > 20 && (
                        <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <span className="text-sm text-gray-500 flex items-center">Page {page}</span>
                            <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
