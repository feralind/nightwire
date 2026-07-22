import { z } from "zod";

export const CrimeSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(["petty", "street", "heavy"]),
  nerve: z.number().int().positive(),
  difficulty: z.number().positive(),
  cashMin: z.number(),
  cashMax: z.number(),
  xp: z.number(),
  heat: z.number(),
});

export const JobSchema = z.object({
  id: z.string(),
  career: z.string(),
  rank: z.union([z.literal(1), z.literal(2)]),
  title: z.string(),
  basePay: z.number(),
  energy: z.number(),
});
