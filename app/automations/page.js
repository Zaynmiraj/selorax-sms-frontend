"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Skeleton } from "../../components/ui/skeleton";
import AutomationCard from "../../components/AutomationCard";

export default function AutomationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["messaging-automations"],
    queryFn: () => msgGet("/automations"),
  });

  const automations = data?.data?.automations || [];
  const variables = data?.data?.variables || {};

  const orderEvents = automations.filter((a) => a.event_group === "order");
  const customerEvents = automations.filter((a) => a.event_group === "customer");

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-automations"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Automations</h2>
        <p className="text-sm text-gray-500">Configure automatic SMS for order and customer events</p>
      </div>

      {/* Order Events */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Order Events</h3>
        <div className="space-y-3">
          {orderEvents.map((a) => (
            <AutomationCard
              key={a.automation_id}
              automation={a}
              variables={variables.order || []}
              onSaved={handleSaved}
            />
          ))}
        </div>
      </div>

      {/* Customer Events */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Events</h3>
        <div className="space-y-3">
          {customerEvents.map((a) => (
            <AutomationCard
              key={a.automation_id}
              automation={a}
              variables={variables.customer || []}
              onSaved={handleSaved}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
