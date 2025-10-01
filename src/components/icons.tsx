import type { SVGProps } from "react";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 9.8c0 7.3-8 11.8-8 11.8z" />
      <path d="M12 8v8" />
      <path d="M12 8H9a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
