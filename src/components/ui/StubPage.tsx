"use client";

import { Module } from "@/components/ui/Module";

export function StubPage({ title, body }: { title: string; body: string }) {
  return (
    <Module title={title}>
      <div
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-inset)",
          padding: 12,
        }}
      >
        <strong>Requirements / Coming online</strong>
        <p style={{ color: "var(--text-dim)" }}>{body}</p>
      </div>
    </Module>
  );
}
