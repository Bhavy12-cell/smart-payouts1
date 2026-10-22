import { z } from "zod";

export const RecipientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  type: z.enum(["percent", "flat"]),
  value: z.number().positive(),
});

export const RuleSchema = z.object({
  basis: z.enum(["gross", "net"]).default("gross"),
  delay_value: z.number().min(0),
  delay_unit: z.enum(["minutes", "days"]),
  recipients: z.array(RecipientSchema).min(1),
});

export type Rule = z.infer<typeof RuleSchema>;