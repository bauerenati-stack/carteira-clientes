export const GRUPOS_VEICULARES = new Set([
  "001656", "001687", "001704", "001706", "001710",
]);

export function grupoVeicular(grupo: string) {
  return GRUPOS_VEICULARES.has(String(grupo).trim().padStart(6, "0"));
}

export function comissaoVeicular(credito: number, numeroParcela: number) {
  if (!Number.isInteger(numeroParcela) || numeroParcela < 1 || numeroParcela > 13) return 0;
  return Math.round((credito * 0.001538 + Number.EPSILON) * 100) / 100;
}
