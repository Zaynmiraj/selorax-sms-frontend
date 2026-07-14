"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "../../lib/api";
import { Skeleton } from "../../components/ui/skeleton";
import AutomationCard from "../../components/AutomationCard";
import { Zap, ShoppingBag, User, Sparkles, CreditCard } from "lucide-react";

export default function AutomationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["messaging-automations"],
    queryFn: () => msgGet("/automations"),
  });

  const automations = data?.data?.automations || [];
  const variables = data?.data?.variables || {};

  const orderEvents = automations.filter((a) => a.event_group === "order");
  const paymentEvents = automations.filter((a) => a.event_group === "payment");
  const customerEvents = automations.filter((a) => a.event_group === "customer");
  const activeCount = automations.filter((a) => a.is_active).length;
  const total = automations.length;

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-automations"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-lg shadow-orange-500/20">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Automations
              </h1>
              <p className="text-sm text-amber-50">
                Auto-send SMS when order &amp; customer events fire
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none">{activeCount}</span>
              <span className="text-sm font-medium text-amber-100">/ {total}</span>
            </div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-100">
              active automations
            </p>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-1.5 text-[11px] text-amber-50">
          <Sparkles className="h-3 w-3" />
          <span>
            Use <span className="font-mono text-white">{`{{variable}}`}</span> placeholders to
            personalize each message at send time
          </span>
        </div>
      </div>

      {/* Order Events */}
      <section>
        <SectionHeader
          icon={ShoppingBag}
          tone="blue"
          title="Order Events"
          active={orderEvents.filter((a) => a.is_active).length}
          total={orderEvents.length}
        />
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
      </section>

      {/* Payment Events */}
      {paymentEvents.length > 0 && (
        <section>
          <SectionHeader
            icon={CreditCard}
            tone="emerald"
            title="Payment Events"
            active={paymentEvents.filter((a) => a.is_active).length}
            total={paymentEvents.length}
          />
          <div className="space-y-3">
            {paymentEvents.map((a) => (
              <AutomationCard
                key={a.automation_id}
                automation={a}
                variables={variables.payment || []}
                onSaved={handleSaved}
              />
            ))}
          </div>
        </section>
      )}

      {/* Customer Events */}
      <section>
        <SectionHeader
          icon={User}
          tone="violet"
          title="Customer Events"
          active={customerEvents.filter((a) => a.is_active).length}
          total={customerEvents.length}
        />
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
      </section>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, active, total, tone = "blue" }) {
  const toneMap = {
    blue: "from-blue-500 to-indigo-500",
    violet: "from-violet-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
  };
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${toneMap[tone]} text-white shadow-sm`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-[11px] text-gray-500">
            {active} of {total} active
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full ${i < active ? "bg-gradient-to-r " + toneMap[tone] : "bg-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
