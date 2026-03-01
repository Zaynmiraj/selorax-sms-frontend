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

  const { data: pricingData } = useQuery({
    queryKey: ["messaging-pricing"],
    queryFn: () => msgGet("/wallet/pricing"),
  });

  const wallet = walletData?.data;
  const transactions = txnData?.data?.transactions || [];
  const totalTxn = txnData?.data?.total || 0;
  const pricing = pricingData?.data || [];

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-wallet"] });
    queryClient.invalidateQueries({ queryKey: ["messaging-transactions"] });
  };

  return (
    <div className="space-y-6">
      {/* Wallet */}
      {loadingWallet ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : (
        <WalletCard wallet={wallet} onTopUp={() => setTopUpOpen(true)} />
      )}

      {/* Pricing */}
      {pricing.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2">Pricing</h3>
            <div className="flex gap-4">
              {pricing.map((p) => (
                <div key={p.pricing_id} className="flex items-center gap-2">
                  <Badge variant="outline">{p.provider}</Badge>
                  <span className="text-sm font-medium">{parseFloat(p.price_per_sms).toFixed(2)} BDT</span>
                  <span className="text-xs text-gray-500">per SMS</span>
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
      />
    </div>
  );
}
