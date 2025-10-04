
import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement> & { width?: number, height?: number, className?: string }) {
  const { width = 80, height = 80, className, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M5 18H3c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h10v11" />
      <path d="M14 9h4l4 4v5h-2" />
      <path d="M10 2h4" />
      <path d="M22 18h-8" />
      <path d="M15 18H9" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M14 9.5H7" />
      <path d="M12 4.5H7" />
      <path d="M10 7H7" />
    </svg>
  );
}
