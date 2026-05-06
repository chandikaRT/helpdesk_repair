const { test: base } = require('@playwright/test');
const { login } = require('../helpers/odoo');

exports.test = base.extend({
  page: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

exports.expect = base.expect;
