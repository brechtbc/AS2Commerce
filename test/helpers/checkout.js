const { api } = require('./api');
const { auth } = require('./cart');
const products = require('../data/products.json');

const checkout = (token, body) => api().post('/checkout').set(auth(token)).send(body);

// Expected amounts computed independently from the product data, in cents
// (no floating point errors), then converted to money.
function expectedAmounts(cart, discountRate) {
  const subtotalCents = cart.reduce((sum, l) => sum + products[l.productId].priceCents * l.quantity, 0);
  const discountCents = Math.round(subtotalCents * discountRate);
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
  };
}

module.exports = { checkout, expectedAmounts };
