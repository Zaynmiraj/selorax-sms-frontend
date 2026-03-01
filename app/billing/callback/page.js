"use client";
import { useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * Billing callback page — shown when the merchant returns from payment.
 *
 * In the new platform billing flow, EPS callbacks are handled by the
 * SeloraX platform. After payment, the platform redirects to the
 * dashboard, which re-loads the embedded app. This page handles
 * the case where the app is loaded with ?payment=success|failed query params.
 */
export default function BillingCallbackPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const chargeId = searchParams.get("charge_id");

  const isSuccess = paymentStatus === "success";
  const isFailed = paymentStatus === "failed";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          {isSuccess ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-green-700">Payment Successful</h2>
              <p className="text-sm text-gray-500">
                Your SMS credits have been added to your wallet.
              </p>
            </>
          ) : isFailed ? (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-700">Payment Failed</h2>
              <p className="text-sm text-gray-500">
                Your payment could not be processed. Please try again from the Billing page.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-gray-400 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-700">Payment Cancelled</h2>
              <p className="text-sm text-gray-500">
                The payment was cancelled. You can try again from the Billing page.
              </p>
            </>
          )}

          {chargeId && (
            <p className="text-xs text-gray-400">Charge: {chargeId}</p>
          )}

          <Button
            onClick={() => (window.location.href = "/billing")}
            className="mt-4"
          >
            Back to Billing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
