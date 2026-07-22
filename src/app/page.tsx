"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/store/gameStore";

export default function HomePage() {
  const router = useRouter();
  const created = useGame((s) => s.created);

  useEffect(() => {
    router.replace(created ? "/city" : "/create");
  }, [created, router]);

  return <main style={{ padding: 24 }}>Loading Nightwire…</main>;
}
