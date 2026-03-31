"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

function HelpItem({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b last:border-0">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium text-left hover:bg-gray-50 transition-colors">
                {title}
                {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            </button>
            {open && <div className="px-4 pb-3 text-sm text-gray-600 space-y-2">{children}</div>}
        </div>
    );
}

export default function HelpSection() {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="p-4 border-b">
                    <h3 className="font-medium text-sm">Help & Instructions</h3>
                </div>
                <HelpItem title="How do Automations work?">
                    <p>Automations send SMS automatically when events happen in your store. Go to the Automations tab to configure them.</p>
                    <p><strong>Instant:</strong> SMS sends immediately when the event occurs.</p>
                    <p><strong>Delayed:</strong> SMS sends after a set number of minutes.</p>
                    <p><strong>Off:</strong> No SMS for this event.</p>
                    <p>Each automation has a template where you can use variables like {"{{customer_name}}"}, {"{{order_id}}"}, {"{{total}}"} etc.</p>
                </HelpItem>
                <HelpItem title="How do Campaigns work?">
                    <p>Campaigns let you send bulk SMS to multiple customers at once.</p>
                    <p><strong>1.</strong> Click "New Campaign" in the Campaigns tab.</p>
                    <p><strong>2.</strong> Choose your audience — paste phone numbers manually or select customers from your store.</p>
                    <p><strong>3.</strong> Write your message.</p>
                    <p><strong>4.</strong> Send immediately or schedule for later.</p>
                    <p>Each recipient uses 1 SMS credit.</p>
                </HelpItem>
                <HelpItem title="Template Variables">
                    <p>Use these in automation templates:</p>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded">{"{{order_id}} {{order_number}} {{customer_name}} {{customer_phone}} {{total}} {{status}} {{tracking_id}} {{store_name}}"}</p>
                    <p>For customer events:</p>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded">{"{{customer_name}} {{customer_phone}} {{customer_email}} {{store_name}}"}</p>
                </HelpItem>
                <HelpItem title="SMS Credits & Billing">
                    <p>Each SMS sent uses 1 credit. Buy packages from the Billing tab.</p>
                    <p>Available packages: 1,000 SMS, 5,000 SMS, 10,000 SMS with volume discounts.</p>
                    <p>Enable Auto-Renewal below to automatically buy a new package when credits run low.</p>
                </HelpItem>
                <HelpItem title="Using Your Own SMS Provider">
                    <p>By default, SMS is sent through the SeloraX platform provider.</p>
                    <p>You can use your own BulkSMS provider by enabling "Use Own Provider" in settings below and entering your API key and sender ID.</p>
                </HelpItem>
            </CardContent>
        </Card>
    );
}
