"use client";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet, msgPost } from "../../../lib/api";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../../components/ui/table";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Send, X, Users, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_COLORS = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    sending: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
};

const RECIPIENT_COLORS = {
    pending: "bg-gray-100 text-gray-600",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
};

export default function CampaignDetailPage() {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["messaging-campaign-detail", id],
        queryFn: () => msgGet(`/campaigns/${id}`),
        refetchInterval: (query) => {
            const status = query.state.data?.data?.status;
            return status === "sending" ? 3000 : false;
        },
    });

    const campaign = data?.data;
    const recipients = campaign?.recipients?.recipients || [];

    if (isLoading) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>;
    }

    if (!campaign) {
        return <p className="text-center text-gray-500 py-12">Campaign not found</p>;
    }

    const progress = campaign.total_recipients > 0
        ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
        : 0;
    const canSend = campaign.status === "draft" || campaign.status === "scheduled";

    const handleSend = async () => {
        const res = await msgPost(`/campaigns/${id}/send`);
        if (res?.status === 200) {
            toast.success("Campaign sending started");
            queryClient.invalidateQueries({ queryKey: ["messaging-campaign-detail", id] });
            queryClient.invalidateQueries({ queryKey: ["messaging-campaigns"] });
            queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] });
        } else {
            toast.error(res?.message || "Failed");
        }
    };

    const handleCancel = async () => {
        const res = await msgPost(`/campaigns/${id}/cancel`);
        if (res?.status === 200) {
            toast.success("Campaign cancelled");
            queryClient.invalidateQueries({ queryKey: ["messaging-campaign-detail", id] });
            queryClient.invalidateQueries({ queryKey: ["messaging-campaigns"] });
            queryClient.invalidateQueries({ queryKey: ["messaging-campaigns-recent"] });
        } else {
            toast.error(res?.message || "Failed");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/campaigns">
                        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">{campaign.name}</h2>
                            <Badge className={STATUS_COLORS[campaign.status]}>{campaign.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{campaign.message}</p>
                    </div>
                </div>
                {canSend && (
                    <div className="flex gap-2">
                        <Button onClick={handleSend}><Send className="h-4 w-4 mr-1" />Send Now</Button>
                        <Button variant="outline" onClick={handleCancel}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    </div>
                )}
            </div>

            {/* Progress */}
            {campaign.status === "sending" && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Sending progress</span>
                            <span className="text-sm text-gray-500">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{campaign.total_recipients}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div><p className="text-xs text-gray-500">Sent</p><p className="text-xl font-bold">{campaign.sent_count}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div><p className="text-xs text-gray-500">Failed</p><p className="text-xl font-bold">{campaign.failed_count}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold">{campaign.total_recipients - campaign.sent_count - campaign.failed_count}</p></div>
                </CardContent></Card>
            </div>

            {/* Recipients table */}
            <Card>
                <CardContent className="p-0">
                    <div className="p-4 border-b"><h3 className="font-medium text-sm">Recipients</h3></div>
                    {recipients.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No recipients</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent At</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipients.map((r) => (
                                    <TableRow key={r.recipient_id}>
                                        <TableCell className="text-sm">{r.phone}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${RECIPIENT_COLORS[r.status]}`}>{r.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            {r.sent_at ? new Date(r.sent_at).toLocaleString("en-BD") : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs text-red-500">{r.error_message || "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
