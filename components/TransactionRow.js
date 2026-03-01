"use client";
import { Badge } from "./ui/badge";
import { TableCell, TableRow } from "./ui/table";

const TYPE_COLORS = {
  topup: "bg-green-100 text-green-700",
  deduction: "bg-red-100 text-red-700",
  refund: "bg-blue-100 text-blue-700",
};

export default function TransactionRow({ txn }) {
  const isPositive = txn.type === "topup" || txn.type === "refund";
  const amountDisplay = `${isPositive ? "+" : "-"}${parseFloat(txn.amount).toFixed(2)}`;

  // payment_method may be in metadata (platform wallet) or as a direct column (legacy)
  const meta = typeof txn.metadata === "string" ? JSON.parse(txn.metadata || "{}") : txn.metadata;
  const method = txn.payment_method || meta?.payment_method || (txn.charge_id ? "platform" : "-");

  return (
    <TableRow>
      <TableCell>
        <Badge variant="outline" className={TYPE_COLORS[txn.type] || ""}>
          {txn.type}
        </Badge>
      </TableCell>
      <TableCell className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {amountDisplay} BDT
      </TableCell>
      <TableCell>{parseFloat(txn.balance_after).toFixed(2)} BDT</TableCell>
      <TableCell className="text-sm text-gray-500">{txn.description || "-"}</TableCell>
      <TableCell className="text-sm text-gray-500">{method}</TableCell>
      <TableCell className="text-sm text-gray-500">
        {new Date(txn.created_at).toLocaleDateString("en-BD", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </TableCell>
    </TableRow>
  );
}
