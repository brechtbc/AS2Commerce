const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const CASH_DISCOUNT_RATE = 0.1;
const PAYMENT_METHODS = ['cash', 'credit_card'];

const specText = fs.readFileSync(path.join(__dirname, '..', 'swagger.yaml'), 'utf8');
const spec = YAML.parse(specText);

const app = express();
app.use(express.json());

const money = (cents) => Number((cents / 100).toFixed(2));
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  const userId = scheme === 'Bearer' ? db.sessions.get(token) : undefined;
  if (!userId) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  req.userId = userId;
  next();
}

function buildCart(userId) {
  const cart = db.carts.get(userId) || [];
  const items = cart.map(({ productId, quantity }) => {
    const product = db.products.find((p) => p.id === productId);
    return {
      productId,
      name: product.name,
      unitPrice: money(product.priceCents),
      quantity,
      lineTotal: money(product.priceCents * quantity),
      lineTotalCents: product.priceCents * quantity,
    };
  });
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  return { items, subtotalCents };
}

const publicItems = (items) => items.map(({ lineTotalCents, ...rest }) => rest);

// --- Documentation ---
app.get('/swagger.yaml', (req, res) => {
  res.type('application/yaml').send(specText);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// --- Register ---
app.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ error: 'email is not valid' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must have at least 6 characters' });
  }
  const normalized = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === normalized)) {
    return res.status(409).json({ error: 'email already registered' });
  }
  const user = {
    id: db.newUserId(),
    name: name.trim(),
    email: normalized,
    passwordHash: db.hashPassword(password),
  };
  db.users.push(user);
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

// --- Login ---
app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !db.verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = crypto.randomUUID();
  db.sessions.set(token, user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// --- Cart ---
app.get('/cart', requireAuth, (req, res) => {
  const { items, subtotalCents } = buildCart(req.userId);
  res.json({ items: publicItems(items), subtotal: money(subtotalCents) });
});

app.post('/cart', requireAuth, (req, res) => {
  const { productId, quantity } = req.body || {};
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'productId and quantity (positive integers) are required' });
  }
  if (!db.products.some((p) => p.id === productId)) {
    return res.status(404).json({ error: 'product not found' });
  }
  const cart = db.carts.get(req.userId) || [];
  const line = cart.find((l) => l.productId === productId);
  if (line) {
    line.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  db.carts.set(req.userId, cart);
  const { items, subtotalCents } = buildCart(req.userId);
  res.status(201).json({ items: publicItems(items), subtotal: money(subtotalCents) });
});

app.delete('/cart', requireAuth, (req, res) => {
  db.carts.set(req.userId, []);
  res.status(204).end();
});

// --- Checkout ---
app.post('/checkout', requireAuth, (req, res) => {
  const { paymentMethod } = req.body || {};
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}` });
  }
  const { items, subtotalCents } = buildCart(req.userId);
  if (items.length === 0) {
    return res.status(400).json({ error: 'cart is empty' });
  }
  // Business rule: 10% discount when paying with cash, none with credit card.
  const discountCents = paymentMethod === 'cash' ? Math.round(subtotalCents * CASH_DISCOUNT_RATE) : 0;
  const order = {
    id: db.newOrderId(),
    userId: req.userId,
    items: publicItems(items),
    paymentMethod,
    subtotal: money(subtotalCents),
    discount: money(discountCents),
    total: money(subtotalCents - discountCents),
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  db.carts.set(req.userId, []);
  res.status(201).json(order);
});

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Checkout API listening on http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
