"use client";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Wallet, MessageSquare } from "lucide-react";

export default function WalletCard({ wallet, onTopUp }) {
  if (!wallet) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">SMS Balance</p>
              <p className="text-3xl font-bold">
                {wallet.balance?.toFixed(2)} <span className="text-base font-normal text-gray-500">BDT</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-1 text-gray-500">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">~{wallet.sms_remaining || 0} SMS remaining</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Rate: {wallet.price_per_sms?.toFixed(2)} BDT/SMS
              </p>
            </div>
            <Button onClick={onTopUp}>Top Up</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
