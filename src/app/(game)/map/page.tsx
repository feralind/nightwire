"use client";

import Link from "next/link";
import { DISTRICTS } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function MapPage() {
  const s = useGame();

  return (
    <div className={hub.wrap}>
      <PageHero
        title="City map"
        subtitle="Live district banners — travel to move your marker."
        tone="city"
        image="/art/city/skyline.webp"
        tall
      />
      <Module footer="Modifiers swing crime odds and shop style">
        <div className={hub.grid}>
          {DISTRICTS.map((d) => {
            const art = DISTRICT_ART[d.id];
            const here = s.district === d.id;
            return (
              <Link
                key={d.id}
                href="/travel"
                className={`${hub.districtCard} ${here ? hub.districtCardHere : ""}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className={hub.districtBg} style={{ backgroundImage: art ? `url(${art})` : undefined }} />
                <div className={hub.districtShade} />
                <div className={hub.districtBody}>
                  <div className={hub.districtName}>{d.name}</div>
                  <p className={hub.sub} style={{ color: "rgba(220,220,220,0.8)" }}>
                    {d.risk} · {d.shopStyle}
                    {here ? " · You are here" : ""}
                  </p>
                  {s.directorEvent && here ? (
                    <span className={hub.chip}>Director: {s.directorEvent.label}</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
