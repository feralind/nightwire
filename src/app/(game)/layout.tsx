"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppChrome } from "@/components/chrome/AppChrome";
import { useGame } from "@/store/gameStore";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const created = useGame((s) => s.created);
  const router = useRouter();

  useEffect(() => {
    if (!created) router.replace("/create");
  }, [created, router]);

  if (!created) return <main style={{ padding: 24 }}>Redirecting…</main>;

  return <AppChrome>{children}</AppChrome>;
}
