"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { msgPost } from "../lib/api";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

export default function SendSmsForm({ wallet, onSent }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const smsParts = Math.ceil(message.length / 160) || 1;
  const costEstimate = (wallet?.price_per_sms || 0.5) * smsParts;

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    setSending(true);
    const res = await msgPost("/send", { phone: phone.trim(), message: message.trim() });

    if (res?.status === 200 && res?.data?.success) {
      toast.success("SMS sent successfully");
      setPhone("");
      setMessage("");
      onSent?.();
    } else if (res?.code === "insufficient_balance") {
      toast.error("Insufficient balance. Please top up.");
    } else {
      toast.error(res?.message || "Failed to send SMS");
    }
    setSending(false);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="font-medium">Send SMS</h3>

        <div>
          <label className="text-sm font-medium mb-1 block">Phone Number</label>
          <Input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Message</label>
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{message.length} characters | {smsParts} SMS part(s)</span>
            <span>Cost: ~{costEstimate.toFixed(2)} BDT</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Balance: <span className="font-medium">{wallet?.balance?.toFixed(2) || "0.00"} BDT</span>
          </p>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send SMS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
