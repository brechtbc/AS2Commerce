const { api } = require('./api');

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const getCart = (token) => api().get('/cart').set(auth(token));

// Start every test from an empty cart, so tests are independent.
async function clearCart(token) {
  await api().delete('/cart').set(auth(token)).expect(204);
}

// items: [{ productId, quantity }]
async function addItems(token, items) {
  for (const item of items) {
    await api().post('/cart').set(auth(token)).send(item).expect(201);
  }
}

// Fresh cart with the given items.
async function prepareCart(token, items) {
  await clearCart(token);
  await addItems(token, items);
}

module.exports = { auth, getCart, clearCart, addItems, prepareCart };
