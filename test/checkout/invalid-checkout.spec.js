const { expect } = require('chai');
const { login } = require('../helpers/auth');
const { prepareCart, getCart } = require('../helpers/cart');
const { checkout } = require('../helpers/checkout');
const { attachEvidence } = require('../helpers/evidence');
const cases = require('../data/checkout-invalid.json');

describe('Checkout - rejected requests (invalid payment method / empty cart)', () => {
  let token;
  before(async () => {
    token = await login();
  });

  cases.forEach(({ id, partition, body, cart, expectedError }) => {
    describe(`${id}: ${partition}`, () => {
      let cartBefore;
      let res;

      beforeEach(async function () {
        await prepareCart(token, cart);
        cartBefore = (await getCart(token)).body;
        res = await checkout(token, body);
        attachEvidence(this, 'POST /checkout', { body }, res);
      });

      it('returns 400 with the expected error message', () => {
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal({ error: expectedError });
      });

      it('does not create an order', () => {
        expect(res.body).to.not.have.any.keys('id', 'total', 'discount');
      });

      it('leaves the cart untouched', async () => {
        const after = await getCart(token);
        expect(after.body).to.deep.equal(cartBefore);
      });
    });
  });
});
