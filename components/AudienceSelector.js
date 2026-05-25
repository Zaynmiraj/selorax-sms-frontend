"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { msgGet } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Skeleton } from "./ui/skeleton";
import { Users, FileText, Tags } from "lucide-react";

const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;

export default function AudienceSelector({ onPhonesChange }) {
    const [tab, setTab] = useState("manual");
    const [rawText, setRawText] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPhones, setSelectedPhones] = useState(new Set());
    const [selectedSegment, setSelectedSegment] = useState("");

    const { data: customerData, isLoading } = useQuery({
        queryKey: ["campaign-customers", search],
        queryFn: () => msgGet("/campaigns/audience/customers", { search, limit: 50 }),
        enabled: tab === "filter",
    });

    const { data: segmentData, isLoading: segmentsLoading } = useQuery({
        queryKey: ["campaign-segments"],
        queryFn: () => msgGet("/campaigns/audience/segments"),
        enabled: tab === "segment",
    });

    const customerFetchFailed = customerData?.status && customerData.status !== 200;
    const customers = customerFetchFailed ? [] : (customerData?.data?.customers || customerData?.data || []);

    const segmentFetchFailed = segmentData?.status && segmentData.status !== 200;
    const segments = segmentFetchFailed ? [] : (segmentData?.data || []);

    // Parse manual input
    const handleManualChange = (text) => {
        setRawText(text);
        const phones = text
            .split(/[\n,;]+/)
            .map(p => p.trim().replace(/[\s\-()]+/g, ""))
            .filter(p => BD_PHONE_REGEX.test(p));
        onPhonesChange(phones, "manual");
    };

    // Toggle customer selection
    const toggleCustomer = (phone) => {
        const next = new Set(selectedPhones);
        if (next.has(phone)) next.delete(phone); else next.add(phone);
        setSelectedPhones(next);
        onPhonesChange([...next], "filter");
    };

    const selectAll = () => {
        const phones = customers
            .map(c => (c.phone || c.customer_phone || "").replace(/[\s\-()]+/g, ""))
            .filter(p => BD_PHONE_REGEX.test(p));
        const next = new Set(phones);
        setSelectedPhones(next);
        onPhonesChange([...next], "filter");
    };

    const handleSegmentChange = (segmentId) => {
        setSelectedSegment(segmentId);
        const seg = segments.find(s => String(s.segment_id) === String(segmentId));
        // Phones are resolved on the server at create time; we pass the segment id
        // plus its (approximate) member count for the summary/credit estimate.
        onPhonesChange([], "segment", {
            segmentId: segmentId ? Number(segmentId) : null,
            count: seg?.member_count ?? 0,
            name: seg?.name ?? null,
        });
    };

    const switchTab = (next) => {
        setTab(next);
        // Reset the outgoing selection so a stale audience from another tab
        // doesn't carry over.
        if (next === "manual") onPhonesChange([], "manual");
        else if (next === "filter") onPhonesChange([...selectedPhones], "filter");
        else if (next === "segment") handleSegmentChange(selectedSegment);
    };

    const manualCount = rawText
        .split(/[\n,;]+/)
        .map(p => p.trim().replace(/[\s\-()]+/g, ""))
        .filter(p => BD_PHONE_REGEX.test(p)).length;

    const TABS = [
        { value: "manual", label: "Paste Numbers", icon: FileText },
        { value: "filter", label: "Select Customers", icon: Users },
        { value: "segment", label: "Segments", icon: Tags },
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
                {TABS.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        onClick={() => switchTab(value)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            tab === value ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600"
                        }`}
                    >
                        <Icon className="h-4 w-4" />{label}
                    </button>
                ))}
            </div>

            {tab === "manual" && (
                <div>
                    <Textarea
                        value={rawText}
                        onChange={(e) => handleManualChange(e.target.value)}
                        placeholder="Paste phone numbers, one per line or comma-separated&#10;e.g. 01712345678, 01812345678"
                        rows={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {manualCount} valid phone number{manualCount !== 1 ? "s" : ""} detected
                    </p>
                </div>
            )}

            {tab === "filter" && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-40 rounded-lg" />
                    ) : customerFetchFailed ? (
                        <p className="text-sm text-red-500 text-center py-6">
                            {customerData?.message || "Failed to fetch customers"}
                        </p>
                    ) : customers.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No customers found</p>
                    ) : (
                        <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                            {customers.map((c, i) => {
                                const phone = (c.phone || c.customer_phone || "").replace(/[\s\-()]+/g, "");
                                const valid = BD_PHONE_REGEX.test(phone);
                                if (!valid) return null;
                                return (
                                    <label key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPhones.has(phone)}
                                            onChange={() => toggleCustomer(phone)}
                                            className="rounded"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{c.name || c.customer_name || "Unknown"}</p>
                                            <p className="text-xs text-gray-500">{phone}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    <p className="text-xs text-gray-500">{selectedPhones.size} customer{selectedPhones.size !== 1 ? "s" : ""} selected</p>
                </div>
            )}

            {tab === "segment" && (
                <div className="space-y-3">
                    {segmentsLoading ? (
                        <Skeleton className="h-10 rounded-lg" />
                    ) : segmentFetchFailed ? (
                        <p className="text-sm text-red-500 text-center py-6">
                            {segmentData?.message || "Failed to load segments"}
                        </p>
                    ) : segments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">
                            No segments found. Create a customer segment in your SeloraX dashboard first.
                        </p>
                    ) : (
                        <>
                            <select
                                value={selectedSegment}
                                onChange={(e) => handleSegmentChange(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                            >
                                <option value="">Choose a segment…</option>
                                {segments.map((s) => (
                                    <option key={s.segment_id} value={s.segment_id}>
                                        {s.name}{s.member_count != null ? ` — ${s.member_count} customers` : ""}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Recipients are resolved from the segment&apos;s current members when the campaign is created.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
