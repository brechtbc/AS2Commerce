# AS2Commerce - E-commerce Checkout API

## What is this API

A small REST API, built with JavaScript and the [Express](https://expressjs.com/) framework, that covers the checkout flow of an e-commerce shop. It has only four endpoints:

| Endpoint | Description |
|---|---|
| `POST /register` | Create a new user |
| `POST /login` | Log in and receive a bearer token |
| `/cart` (`GET`, `POST`, `DELETE`) | View, add products to, or empty the cart of the logged-in user |
| `POST /checkout` | Pay for the cart and create an order |

All data is stored **in memory** (plain variables), so everything is reset when the server restarts. The API specification is written in Swagger/OpenAPI (`swagger.yaml`) and served by the API itself.

## How to Install

Requirements: [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install
```

## How to Run

```bash
npm start
```

The server listens on port `3000` by default. Use another port with the `PORT` environment variable (for example `PORT=4000 npm start`).

## Test Data

Data available when the server starts.

**Users**

| Name | Email | Password |
|---|---|---|
| Alice Johnson | alice@example.com | alice123 |
| Bob Smith | bob@example.com | bob123 |
| Carol White | carol@example.com | carol123 |

**Products** (there is no products endpoint; use these ids in `POST /cart`)

| Id | Name | Price |
|---|---|---|
| 1 | Wireless Mouse | 25.00 |
| 2 | Mechanical Keyboard | 80.00 |
| 3 | USB-C Hub | 45.00 |

## Business Rules

- Paying with **cash** gives a **10% discount** on the cart subtotal.
- Paying with **credit card** (`credit_card`) gives **no discount**.
- `cart` and `checkout` require a bearer token from `POST /login` (`Authorization: Bearer <token>`).
- Each user has their own cart. Adding a product already in the cart increases its quantity.
- Checkout fails when the cart is empty. After a successful checkout the cart is emptied.
- Registering requires a valid email that is not yet registered and a password of at least 6 characters.

Example: cart with 2 Wireless Mouse (50.00) + 1 USB-C Hub (45.00) = 95.00 → cash total 85.50, credit card total 95.00.

## Important URLs

| URL | Description |
|---|---|
| http://localhost:3000/api-docs | Swagger UI (interactive API documentation) |
| http://localhost:3000/swagger.yaml | Raw YAML specification |
| http://localhost:3000/register | Register endpoint |
| http://localhost:3000/login | Login endpoint |
| http://localhost:3000/cart | Cart endpoint |
| http://localhost:3000/checkout | Checkout endpoint |

### Quick example

```bash
# 1. Login (copy the token from the response)
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"alice123"}'

# 2. Add a product to the cart
curl -X POST http://localhost:3000/cart -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" -d '{"productId":1,"quantity":2}'

# 3. Checkout paying with cash (10% discount)
curl -X POST http://localhost:3000/checkout -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" -d '{"paymentMethod":"cash"}'
```

## Automated API tests

Stack: [Mocha](https://mochajs.org/), [SuperTest](https://github.com/ladjs/supertest), [Chai](https://www.chaijs.com/), [dotenv](https://github.com/motdotla/dotenv) and [Mochawesome](https://github.com/adamgruber/mochawesome).

```bash
cp .env.example .env   # once; holds BASE_URL and the test user
npm test
```

If nothing answers on `BASE_URL`, the run starts the API itself and stops it afterwards. The HTML report is written to `mochawesome-report/index.html` (request/response evidence is attached to each test).

| Folder | Content |
|---|---|
| `test/checkout/` | Specs per module: `discount.spec.js` (cash 10% / credit card 0%), `invalid-checkout.spec.js` (invalid payment method, empty cart) |
| `test/helpers/` | Reusable functions: `login()`, cart preparation, `checkout()`, expected amounts, report evidence |
| `test/data/` | Data-driven test data (JSON): products and one entry per equivalence partition (EP1-EP6) |
| `test/support/` | Mocha root hooks (loads `.env`, starts the API when needed) |
