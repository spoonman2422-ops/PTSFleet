
import Image from 'next/image';
import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement> & { width?: number, height?: number, className?: string }) {
  const { width = 80, height = 80, ...rest } = props;
  return (
    <Image
      {...rest}
      src="/IMG_20251004_085050.jpg"
      alt="Platinum Trucking Services Logo"
      width={width}
      height={height}
      priority
    />
  );
}
