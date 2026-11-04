const { expect } = require('chai');
const { login } = require('../helpers/auth');
const { prepareCart, getCart } = require('../helpers/cart');
const { checkout, expectedAmounts } = require('../helpers/checkout');
const { attachEvidence } = require('../helpers/evidence');
const cases = require('../data/checkout-discount.json');

describe('Checkout - discount rule (valid payment methods)', () => {
  let token;
  before(async () => {
    token = await login();
  });

  cases.forEach(({ id, partition, paymentMethod, discountRate, cart }) => {
    describe(`${id}: ${partition}`, () => {
      const expected = expectedAmounts(cart, discountRate);
      let res;

      beforeEach(async function () {
        await prepareCart(token, cart);
        const body = { paymentMethod };
        res = await checkout(token, body);
        attachEvidence(this, 'POST /checkout', { body }, res);
      });

      it('returns 201 and echoes the payment method', () => {
        expect(res.status).to.equal(201);
        expect(res.body.paymentMethod).to.equal(paymentMethod);
      });

      it(`subtotal is ${expected.subtotal}`, () => {
        expect(res.body.subtotal).to.equal(expected.subtotal);
      });

      it(`discount is ${expected.discount}`, () => {
        expect(res.body.discount).to.equal(expected.discount);
      });

      it(`total is ${expected.total}`, () => {
        expect(res.body.total).to.equal(expected.total);
      });

      it('empties the cart after checkout', async () => {
        const after = await getCart(token);
        expect(after.status).to.equal(200);
        expect(after.body.items).to.be.an('array').that.is.empty;
        expect(after.body.subtotal).to.equal(0);
      });
    });
  });
});
