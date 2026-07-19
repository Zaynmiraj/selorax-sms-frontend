"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /admin → send the operator to the Stores screen by default.
export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/stores");
  }, [router]);
  return null;
}
