export function cleanCart(value, products) {
  const cart = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return cart;
  for (const p of products) {
    const quantity = value[p.id];
    if (Number.isInteger(quantity) && quantity > 0) cart[p.id] = Math.min(quantity, 99);
  }
  return cart;
}
export function totals(cart, products, currency) {
  if (!['SGD', 'HKD'].includes(currency)) throw new Error('Unsupported currency');
  return products.reduce((result, p) => {
    const quantity = cart[p.id] || 0;
    result.count += quantity;
    result.cents += quantity * p.prices[currency];
    return result;
  }, { count: 0, cents: 0 });
}
