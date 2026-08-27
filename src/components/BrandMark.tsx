import Image from "next/image";

export function BrandMark({
  className = "h-9 w-auto",
  size = 40,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/crest-mark.webp"
      alt=""
      width={size}
      height={Math.round(size * 0.86)}
      sizes={`${size}px`}
      quality={80}
      priority={priority}
      className={className}
    />
  );
}
