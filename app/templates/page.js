"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { msgGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import TemplateEditor from "@/components/TemplateEditor";

const EVENT_TOPICS = [
  "order.confirmed",
  "order.shipped",
  "order.delivered",
  "order.cancelled",
];

export default function TemplatesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["messaging-templates"],
    queryFn: () => msgGet("/templates"),
  });

  const templates = data?.data || [];

  const getTemplate = (topic) =>
    templates.find((t) => t.event_topic === topic) || null;

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["messaging-templates"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Failed to load templates. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Configure SMS templates for each order event. Use variable tags to personalize messages.
      </p>
      {EVENT_TOPICS.map((topic) => (
        <TemplateEditor
          key={topic}
          eventTopic={topic}
          template={getTemplate(topic)}
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
}
