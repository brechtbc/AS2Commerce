const request = require('supertest');

// SuperTest agent pointed at the API defined in .env (BASE_URL).
const api = () => request(process.env.BASE_URL);

module.exports = { api };
