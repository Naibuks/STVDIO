import Link from "next/link";
import SafeImage from "./SafeImage";
import { formatCategory } from "@/lib/format";
import { formatDelivery, formatMoney } from "@/lib/money";
import type { Service } from "@/types/api";

/** One listing in the marketplace grid. */
export default function ServiceCard({ service }: { service: Service }) {
  const cover = service.media?.[0];

  return (
    <article className="group flex flex-col">
      <Link href={`/market/${service._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-current/5">
          <SafeImage
            src={cover?.url}
            alt={service.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            fallback={
              <div className="flex h-full items-center justify-center font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                {formatCategory(service.category)}
              </div>
            }
          />
          {!service.isActive && (
            <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white">
              Unlisted
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-medium leading-snug">{service.title}</h3>
          <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
            {formatCategory(service.category)}
          </span>
        </div>
      </Link>

      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        <Link
          href={`/profile/${service.creator?.username ?? ""}`}
          className="hover:opacity-70"
        >
          {service.creator?.name ?? "Unknown"}
        </Link>
      </p>

      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-current/15 pt-3">
        <span className="text-base font-medium">
          {formatMoney(service.price, service.currency)}
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {formatDelivery(service.deliveryTime)}
        </span>
      </div>
    </article>
  );
}
