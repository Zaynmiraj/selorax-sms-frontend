"use client";
import { Button } from "./ui/button";
import { MessageSquare, RefreshCw, Sparkles } from "lucide-react";

export default function WalletCard({ smsCredits, onTopUp, autoRenew }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg shadow-blue-500/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-blue-100 font-medium">SMS Credits</p>
            <p className="text-4xl font-bold tracking-tight">
              {(smsCredits || 0).toLocaleString()}
              <span className="text-lg font-normal text-blue-200 ml-2">SMS</span>
            </p>
            {autoRenew?.enabled && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <RefreshCw className="h-3 w-3 text-green-300" />
                <span className="text-[11px] text-green-200 font-medium">
                  Auto-renew: {autoRenew.packageName} (below {autoRenew.threshold})
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={onTopUp}
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg shadow-black/10 rounded-xl px-5"
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          Buy SMS
        </Button>
      </div>
    </div>
  );
}
