import Link from "next/link";
import SafeImage from "./SafeImage";
import { formatCategory } from "@/lib/format";
import { formatDelivery, formatMoney } from "@/lib/money";
import type { Service } from "@/types/api";

/** One listing in the marketplace grid. */
export default function ServiceCard({ service }: { service: Service }) {
  const cover = service.media?.[0];

  return (
    <article className="group flex flex-col border border-[#1d1d1d] bg-[#0d0d0d] transition-colors duration-200 hover:border-[#2a2a2a]">
      <div className="relative">
        {/*
          A fixed 4:3 frame with object-cover, for the same reason the project
          cards have one: listing images arrive at every ratio, and the grid
          should stay even. Landscape rather than the feed's portrait keeps a
          listing compact, so price and delivery stay near the fold.
        */}
        <Link
          href={`/market/${service._id}`}
          className="block aspect-[4/3] overflow-hidden"
        >
          <SafeImage
            src={cover?.url}
            alt={service.title}
            className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.01]"
            fallback={
              <div className="flex h-full w-full items-center justify-center font-mono text-[0.6rem] uppercase tracking-[0.26em] text-[#f5f1ea]/35">
                {formatCategory(service.category)}
              </div>
            }
          />
        </Link>

        {!service.isActive && (
          <span className="absolute left-2 top-2 bg-black/75 px-2 py-1 font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[#f5f1ea]">
            Unlisted
          </span>
        )}
      </div>

      <div className="border-t border-[#1d1d1d] p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[1.3rem] font-medium leading-none tracking-[-0.06em] text-[#f5f1ea]">
            {service.title}
          </h3>
          <span className="shrink-0 font-mono text-[0.52rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
            {formatCategory(service.category)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
          <Link href={`/profile/${service.creator?.username ?? ""}`} className="hover:text-[#f5f1ea]">
            {service.creator?.name ?? "Unknown"}
          </Link>
        </p>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-[#1d1d1d] pt-3">
          <span className="text-xl font-medium tracking-[-0.04em] text-[#f5f1ea]">
            {formatMoney(service.price, service.currency)}
          </span>
          <span className="font-mono text-[0.52rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
            {formatDelivery(service.deliveryTime)}
          </span>
        </div>
      </div>
    </article>
  );
}
