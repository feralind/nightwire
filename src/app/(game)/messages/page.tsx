"use client";
import { Module } from "@/components/ui/Module";
import { useGame } from "@/store/gameStore";
export default function Page() {
  const logs = useGame((s) => s.logs.filter((l) => l.kind === "diegetic").slice(0, 20));
  return (
    <Module title="Messages">
      <ul>
        {logs.map((l) => (
          <li key={l.id}>{l.text}</li>
        ))}
        {!logs.length && <li>Inbox empty. Mentor will write soon.</li>}
      </ul>
    </Module>
  );
}
