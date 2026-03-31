"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Card, CardContent } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { MessageSquare } from "lucide-react";
import WalletCard from "../../components/WalletCard";
import TopUpDialog from "../../components/TopUpDialog";
import TransactionRow from "../../components/TransactionRow";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: walletData, isLoading: loadingWallet } = useQuery({
    queryKey: ["messaging-wallet"],
    queryFn: () => msgGet("/wallet"),
  });

  const { data: txnData, isLoading: loadingTxn } = useQuery({
    queryKey: ["messaging-transactions", page],
    queryFn: () => msgGet("/wallet/transactions", { page, limit: 20 }),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["messaging-settings"],
    queryFn: () => msgGet("/settings"),
  });

  const wallet = walletData?.data;
  const packages = wallet?.packages || [];
  const smsCredits = wallet?.sms_credits || 0;
  const transactions = txnData?.data?.transactions || [];
  const totalTxn = txnData?.data?.total || 0;
  const settings = settingsData?.data;
  const autoRenew = settings?.auto_renew_enabled ? {
    enabled: true,
    packageName: packages.find(p => p.package_id === settings.auto_renew_package_id)?.name || "—",
    threshold: settings.auto_renew_threshold || 50,
  } : null;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
  };

  return (
    <div className="space-y-6">
      {/* Wallet */}
      {loadingWallet ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : (
        <WalletCard smsCredits={smsCredits} onTopUp={() => setTopUpOpen(true)} autoRenew={autoRenew} />
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-3">SMS Packages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.package_id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{pkg.name}</p>
                    <p className="text-xs text-gray-500">
                      {Number(pkg.sms_count).toLocaleString()} SMS — ৳{parseFloat(pkg.price_per_sms).toFixed(2)}/SMS
                    </p>
                    <p className="text-xs font-semibold text-blue-600">
                      ৳{Number(pkg.total_price).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium text-sm">Transaction History</h3>
            <span className="text-xs text-gray-500">{totalTxn} total</span>
          </div>
          {loadingTxn ? (
            <Skeleton className="h-24 m-4 rounded-lg" />
          ) : transactions.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No transactions yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TransactionRow key={txn.transaction_id} txn={txn} />
                  ))}
                </TableBody>
              </Table>
              {totalTxn > 20 && (
                <div className="p-4 flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500 flex items-center">Page {page}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page * 20 >= totalTxn}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onSuccess={refreshAll}
        packages={packages}
      />
    </div>
  );
}
