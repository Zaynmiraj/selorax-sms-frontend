"use client";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import SmsPreview, { calculateSmsInfo } from "./SmsPreview";
import MessageCounter from "./MessageCounter";
import { msgPost } from "../lib/api";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;

export default function SendSmsForm({ smsCredits = 0, onSent }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { parts: smsParts } = calculateSmsInfo(message);

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s\-()]+/g, "");
    if (!BD_PHONE_REGEX.test(cleanPhone)) {
      toast.error("Invalid phone number. Use format: 01XXXXXXXXX");
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
    } else if (res?.code === "insufficient_balance" || res?.data?.error === "insufficient_balance") {
      toast.error("No SMS credits remaining. Please buy a package.");
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Message</label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <MessageCounter value={message} />
          </div>
          <SmsPreview
            text={message}
            senderLabel={phone.trim() || "Recipient"}
            note="Real-time preview of the message that will be delivered."
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Credits: <span className="font-medium">{smsCredits.toLocaleString()} SMS</span>
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
