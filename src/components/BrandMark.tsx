import Image from "next/image";
import Link from "next/link";

export function BrandMark({
  className = "h-8 w-auto",
  size = 32,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/crest-mark.webp"
      alt="Order of Battle"
      width={size}
      height={Math.round(size * 0.86)}
      sizes={`${size}px`}
      quality={80}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className={className}
    />
  );
}

export function SiteBrandLockup({
  subtitle = "Army lists for Age of Sigmar",
}: {
  subtitle?: string;
}) {
  return (
    <Link href="/" className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5">
      <BrandMark size={32} className="h-8 w-auto shrink-0" priority />
      <span className="min-w-0 leading-tight">
        <span className="gold-text-lit block truncate font-serif text-[17px] font-bold leading-none sm:text-lg">
          Order of Battle
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-parchment/85 sm:text-xs">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
