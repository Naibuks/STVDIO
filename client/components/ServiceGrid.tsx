import ServiceCard from "./ServiceCard";
import type { Service } from "@/types/api";

export default function ServiceGrid({
  services,
  emptyMessage = "No services listed yet.",
}: {
  services: Service[];
  emptyMessage?: string;
}) {
  if (services.length === 0) {
    return (
      <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service._id} service={service} />
      ))}
    </div>
  );
}
