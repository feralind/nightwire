"use client";
import { Module } from "@/components/ui/Module";
import { useGame } from "@/store/gameStore";
export default function Page() {
  const logs = useGame((s) => s.logs);
  return (
    <Module title="Events">
      <ul>
        {logs.map((l) => (
          <li key={l.id}>
            <span style={{ color: "var(--text-dim)" }}>[{l.kind}]</span> {l.text}
          </li>
        ))}
      </ul>
    </Module>
  );
}
