"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { msgGet } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Users, FileText, Search } from "lucide-react";

const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;

export default function AudienceSelector({ onPhonesChange }) {
    const [tab, setTab] = useState("manual");
    const [rawText, setRawText] = useState("");
    const [search, setSearch] = useState("");
    const [selectedPhones, setSelectedPhones] = useState(new Set());

    const { data: customerData, isLoading } = useQuery({
        queryKey: ["campaign-customers", search],
        queryFn: () => msgGet("/campaigns/audience/customers", { search, limit: 50 }),
        enabled: tab === "filter",
    });

    const customerFetchFailed = customerData?.status && customerData.status !== 200;
    const customers = customerFetchFailed ? [] : (customerData?.data?.customers || customerData?.data || []);

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

    const manualCount = rawText
        .split(/[\n,;]+/)
        .map(p => p.trim().replace(/[\s\-()]+/g, ""))
        .filter(p => BD_PHONE_REGEX.test(p)).length;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    onClick={() => setTab("manual")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        tab === "manual" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600"
                    }`}
                >
                    <FileText className="h-4 w-4" />Paste Numbers
                </button>
                <button
                    onClick={() => setTab("filter")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        tab === "filter" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600"
                    }`}
                >
                    <Users className="h-4 w-4" />Select Customers
                </button>
            </div>

            {tab === "manual" ? (
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
            ) : (
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
        </div>
    );
}
