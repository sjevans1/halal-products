/** SHOP-01: source-of-truth guard for the pre-launch planning experience.
 * This cannot grant purchase rights. No server, payment, inventory, or order API.
 */
export function validateConceptOffers(catalog, offers) {
  if (!catalog || !Array.isArray(catalog.products) || !offers || offers.stage !== 'concept-only' || offers.currency !== 'JMD') {
    throw new Error('Concept-only JMD offer catalogue is required');
  }
  const ids = catalog.products.map(p => p.id);
  if (new Set(ids).size !== ids.length || !Array.isArray(offers.items) || offers.items.length !== ids.length) {
    throw new Error('Every product must have exactly one concept offer');
  }
  const offered = new Set();
  for (const item of offers.items) {
    if (!ids.includes(item.id) || offered.has(item.id)) throw new Error('Missing, unknown or duplicated offer product ID');
    offered.add(item.id);
    if (item.status !== 'concept' || item.availability !== 'unconfirmed' || item.priceJmd !== null || item.packSize !== null || item.halalEvidence !== 'unverified') {
      throw new Error(`Commercial claims forbidden in SHOP-01: ${item.id}`);
    }
  }
  return true;
}

export const MAX_QTY = 12;
export function normalizePlan(input, allowedIds, maxQty = MAX_QTY) {
  if (!Array.isArray(input)) return [];
  const allowed = new Set(allowedIds);
  const result = [], used = new Set();
  for (const row of input) {
    if (!row || typeof row.id !== 'string' || !allowed.has(row.id) || used.has(row.id)) continue;
    if (!Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > maxQty) continue;
    used.add(row.id);
    result.push({id: row.id, quantity: row.quantity});
    if (result.length >= allowed.size) break;
  }
  return result;
}
export function planAsText(rows, products) {
  const byId = new Map(products.map(p => [p.id, p]));
  return [
    'Tayyib Halal | My idea list',
    'Concepts only. This is not an order, quote, reservation, or proof of halal certification.',
    'Prices and pack sizes have not been confirmed.',
    '',
    ...rows.filter(r => byId.has(r.id)).map(r => `${r.quantity} × ${byId.get(r.id).name}`),
    '',
    'Explore Tayyib Halal in your browser.'
  ].join('\n');
}
