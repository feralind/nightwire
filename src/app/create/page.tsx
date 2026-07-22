"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DISTRICTS } from "@/content/catalog";
import type { DistrictId } from "@/game/types";
import { useGame } from "@/store/gameStore";
import { GameButton } from "@/components/ui/GameButton";
import styles from "./create.module.css";

const BACKGROUNDS = ["Street kid", "Dock family", "Clerk parents", "Pre-med dropout"];

export default function CreatePage() {
  const createCharacter = useGame((s) => s.createCharacter);
  const created = useGame((s) => s.created);
  const router = useRouter();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<DistrictId>("glassrow");
  const [background, setBackground] = useState(BACKGROUNDS[0]);

  useEffect(() => {
    if (created) router.replace("/city");
  }, [created, router]);

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1>NIGHTWIRE</h1>
        <p className={styles.sub}>Create your dual life. Student by day. Operator by night.</p>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        </label>
        <label>
          Origin district
          <select value={district} onChange={(e) => setDistrict(e.target.value as DistrictId)}>
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Background
          <select value={background} onChange={(e) => setBackground(e.target.value)}>
            {BACKGROUNDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <GameButton
          onClick={() => {
            createCharacter(name, district, background);
            router.push("/city");
          }}
        >
          Enter the city
        </GameButton>
      </div>
    </main>
  );
}
