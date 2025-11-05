export const KINDS_REENVIOS = ["webhook"] as const;

export type IKindReenvio = (typeof KINDS_REENVIOS)[number];
