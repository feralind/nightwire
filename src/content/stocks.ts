import type { DistrictId } from "@/game/types";

/** District paper tickers — speculative shares, not real equities. */
export type StockDef = {
  id: string;
  name: string;
  ticker: string;
  district: DistrictId;
  blurb: string;
  /** Anchor price around which the paper drifts */
  basePrice: number;
  /** 0.04–0.18 typical hourly swing amplitude */
  volatility: number;
  /** Clean $/share / week while held (scaled in tick) */
  dividendPerShare: number;
};

export const STOCKS: StockDef[] = [
  {
    id: "glass_civic",
    name: "Glassrow Civic Paper",
    ticker: "GLS",
    district: "glassrow",
    blurb: "Tourist float and elite shop receipts. Moves on festival nights.",
    basePrice: 120,
    volatility: 0.06,
    dividendPerShare: 2,
  },
  {
    id: "mill_iron",
    name: "Millstone Iron Notes",
    ticker: "MIL",
    district: "millstone",
    blurb: "Warehouse leases and scrap futures. Street heat softens bids.",
    basePrice: 95,
    volatility: 0.09,
    dividendPerShare: 1.5,
  },
  {
    id: "dock_harbor",
    name: "DocksReach Harbor Scrip",
    ticker: "DRK",
    district: "docksreach",
    blurb: "Crane hours and container bets. Strike days crush the print.",
    basePrice: 110,
    volatility: 0.14,
    dividendPerShare: 2.5,
  },
  {
    id: "ash_civic",
    name: "Ashcourt Clerk Bonds",
    ticker: "ASH",
    district: "ashcourt",
    blurb: "Filing fees and quiet bureaucracy. Slow, stubborn, civic-leaning.",
    basePrice: 100,
    volatility: 0.05,
    dividendPerShare: 1.8,
  },
  {
    id: "spire_loans",
    name: "Spireyard Loan Strips",
    ticker: "SPI",
    district: "spireyard",
    blurb: "High-rise paper. Commerce courses read the tape better.",
    basePrice: 160,
    volatility: 0.11,
    dividendPerShare: 3,
  },
  {
    id: "commons_scrap",
    name: "Old Commons Scrap Pool",
    ticker: "COM",
    district: "oldcommons",
    blurb: "Pawn lanes and alley salvage. Cheap entry, sharp swings.",
    basePrice: 70,
    volatility: 0.16,
    dividendPerShare: 1,
  },
  {
    id: "pier_neon",
    name: "Neon Pier Comp Chips",
    ticker: "NEO",
    district: "neonpier",
    blurb: "Casino float dressed as leisure stock. Volatility is the product.",
    basePrice: 140,
    volatility: 0.18,
    dividendPerShare: 0.5,
  },
  {
    id: "clinic_ward",
    name: "Red Clinic Ward Scripts",
    ticker: "RED",
    district: "redclinic",
    blurb: "Med supply contracts. Sweeps and heat make buyers nervous.",
    basePrice: 105,
    volatility: 0.08,
    dividendPerShare: 2.2,
  },
];

export function getStock(id: string): StockDef | undefined {
  return STOCKS.find((s) => s.id === id);
}
