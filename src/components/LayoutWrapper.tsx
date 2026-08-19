"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="min-h-screen bg-slate-50 w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-white min-h-screen flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.05)]">
      {children}
    </div>
  );
}
