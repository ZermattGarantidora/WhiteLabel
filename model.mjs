export function parseBR(value) {
  const raw = String(value).trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  if (/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(raw)) return Number(raw.replace(/\./g, '').replace(',', '.'));
  if (/^\d+\.\d{1,2}$/.test(raw)) return Number(raw);
  return NaN;
}

export function calculate(base, rate, share, months = 1) {
  if (![base, rate, share, months].every(Number.isFinite) || base < 0 || base > 1e12 || rate < 0 || rate > 100 || share < 0 || share > 100 || ![1, 12].includes(months)) {
    throw new RangeError('Valores fora dos limites da simulação.');
  }
  const baseCents = Math.round(base * 100);
  const grossCents = Math.round(baseCents * rate / 100);
  const adminCents = Math.round(grossCents * share / 100);
  return {
    base: baseCents * months / 100,
    gross: grossCents * months / 100,
    admin: adminCents * months / 100,
    remainder: (grossCents - adminCents) * months / 100,
    effective: rate * share / 100,
    share,
    months
  };
}

export function resolveRate(quantity, baseRate, tiers = []) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000 || !Number.isFinite(baseRate) || baseRate < 0 || baseRate > 100 || !Array.isArray(tiers)) throw new RangeError('Quantidade ou taxa inicial inválida.');
  const thresholds = new Set();
  let appliedThreshold = 0;
  let rate = baseRate;
  for (const tier of tiers) {
    if (!Number.isInteger(tier.minimum) || tier.minimum < 1 || tier.minimum > 100000 || thresholds.has(tier.minimum) || !Number.isFinite(tier.rate) || tier.rate < 0 || tier.rate > 100) throw new RangeError('Faixas de taxa inválidas.');
    thresholds.add(tier.minimum);
    if (tier.minimum <= quantity && tier.minimum > appliedThreshold) {rate = tier.rate; appliedThreshold = tier.minimum;}
  }
  return {rate, appliedThreshold};
}

export function calculatePortfolio(quantity, basePerCondo, rate, share, months = 1, tiers = []) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000 || !Number.isFinite(basePerCondo) || basePerCondo < 0 || basePerCondo > 1e12) {
    throw new RangeError('Quantidade ou arrecadação por condomínio inválida.');
  }
  const {rate:appliedRate, appliedThreshold} = resolveRate(quantity, rate, tiers);
  const totalBaseCents = Math.round(basePerCondo * 100) * quantity;
  const result = calculate(totalBaseCents / 100, appliedRate, share, months);
  const unitPrice = calculate(basePerCondo, appliedRate, share).gross;
  return {...result, quantity, basePerCondo, baseMonthly:totalBaseCents / 100, rate:appliedRate, initialRate:rate, appliedThreshold, unitPrice};
}
