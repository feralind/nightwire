"use client";
import { Module } from "@/components/ui/Module";
import { DISTRICTS } from "@/content/catalog";
export default function Page() {
  return (
    <Module title="Codex">
      <h3>Districts</h3>
      <ul>
        {DISTRICTS.map((d) => (
          <li key={d.id}>
            <strong>{d.name}</strong> — {d.risk}. Shop style: {d.shopStyle}.
          </li>
        ))}
      </ul>
      <h3>Pillar</h3>
      <p>Nightwire is a dual-life city sim where every honest paycheck and dirty score rewrites who you are — and the city writes back.</p>
    </Module>
  );
}
