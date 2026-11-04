const { api } = require('./api');

// POST /login -> bearer token
async function login(email = process.env.USER_EMAIL, password = process.env.USER_PASSWORD) {
  const res = await api().post('/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed with HTTP ${res.status}`);
  return res.body.token;
}

module.exports = { login };
