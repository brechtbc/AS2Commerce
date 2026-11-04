const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'));
}

// Prices are stored in cents to avoid floating point errors.
const products = [
  { id: 1, name: 'Wireless Mouse', priceCents: 2500 },
  { id: 2, name: 'Mechanical Keyboard', priceCents: 8000 },
  { id: 3, name: 'USB-C Hub', priceCents: 4500 },
];

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', passwordHash: hashPassword('alice123') },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', passwordHash: hashPassword('bob123') },
  { id: 3, name: 'Carol White', email: 'carol@example.com', passwordHash: hashPassword('carol123') },
];

// token -> userId
const sessions = new Map();
// userId -> [{ productId, quantity }]
const carts = new Map();
const orders = [];

let nextUserId = users.length + 1;
let nextOrderId = 1;

module.exports = {
  products,
  users,
  sessions,
  carts,
  orders,
  hashPassword,
  verifyPassword,
  newUserId: () => nextUserId++,
  newOrderId: () => nextOrderId++,
};
