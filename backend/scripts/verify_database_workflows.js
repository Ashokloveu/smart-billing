const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json();
  return { response, payload };
}

async function main() {
  const replicaSet = await MongoMemoryReplSet.create({
    binary: { version: '7.0.14' },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replicaSet.getUri('smart_billing_e2e');
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.JWT_ACCESS_SECRET = 'database_test_access_secret_at_least_32_chars';
  process.env.JWT_REFRESH_SECRET = 'database_test_refresh_secret_at_least_32_chars';

  const mongoose = require('mongoose');
  const { connectDatabase } = require('../dist/config/database');
  const { createApp } = require('../dist/app');

  await connectDatabase();
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
    const signup = await request(baseUrl, '/auth/signup', {
      method: 'POST',
      body: { fullName: 'Treasury Owner', email: 'owner@example.test', phone: '+9779800000001', password: 'OwnerPass123' },
    });
    assert.equal(signup.response.status, 201);

    const login = await request(baseUrl, '/auth/login', {
      method: 'POST', body: { identifier: 'owner@example.test', password: 'OwnerPass123' },
    });
    assert.equal(login.response.status, 200);
    const ownerHeaders = { authorization: `Bearer ${login.payload.data.accessToken}` };

    const organization = await request(baseUrl, '/organizations', {
      method: 'POST', headers: ownerHeaders,
      body: {
        name: 'Treasury Test Business', slug: 'treasury-test-business', country: 'NP', currency: 'NPR',
        taxRegistration: { type: 'PAN', number: '601234567' },
        settings: { defaultCurrency: 'NPR', decimalPrecision: 2, roundOffMethod: 'nearest', allowNegativeStock: false, displayCalendar: 'both', primaryLanguage: 'bilingual' },
      },
    });
    assert.equal(organization.response.status, 201);
    const orgId = organization.payload.data._id;

    const organizations = await request(baseUrl, '/organizations', { headers: ownerHeaders });
    assert.equal(organizations.response.status, 200);
    assert.equal(organizations.payload.data.length, 1);
    assert.equal(organizations.payload.data[0]._id, orgId);

    const makeAccount = (name, type, openingBalance, extras = {}) => request(baseUrl, `/organizations/${orgId}/treasury/accounts`, {
      method: 'POST', headers: ownerHeaders,
      body: { name, type, openingBalance, color: type === 'cash' ? '#f59e0b' : '#2563eb', ...extras },
    });
    const cash = await makeAccount('Main Cash', 'cash', '500.00');
    const bank = await makeAccount('Test Bank', 'bank', '100.00', { accountNumber: '00123456789', bankName: 'Test Bank Ltd', branch: 'Kathmandu' });
    assert.equal(cash.response.status, 201);
    assert.equal(bank.response.status, 201);

    const transfer = await request(baseUrl, `/organizations/${orgId}/treasury/transfers`, {
      method: 'POST', headers: ownerHeaders,
      body: {
        fromAccountId: cash.payload.data._id,
        toAccountId: bank.payload.data._id,
        amount: '100.00', date: '2026-09-05T00:00:00.000Z', bsDate: '2083-05-20', narration: 'Cash deposited into bank',
      },
    });
    assert.equal(transfer.response.status, 201);

    const accounts = await request(baseUrl, `/organizations/${orgId}/treasury/accounts`, { headers: ownerHeaders });
    const accountBalance = (id) => Number(accounts.payload.data.find((item) => item._id === id).ledgerAccountId.currentBalance.$numberDecimal);
    assert.equal(accountBalance(cash.payload.data._id), 400);
    assert.equal(accountBalance(bank.payload.data._id), 200);

    const bankLedger = await request(baseUrl, `/organizations/${orgId}/treasury/accounts/${bank.payload.data._id}/ledger`, { headers: ownerHeaders });
    assert.equal(bankLedger.response.status, 200);
    assert.equal(bankLedger.payload.data.length, 1);
    assert.equal(Number(bankLedger.payload.data[0].debit.$numberDecimal), 100);
    assert.equal(Number(bankLedger.payload.data[0].credit.$numberDecimal), 0);
    assert.equal(Number(bankLedger.payload.data[0].balance.$numberDecimal), 200);

    const reconcile = await request(baseUrl, `/organizations/${orgId}/treasury/accounts/${bank.payload.data._id}/reconciliation/${bankLedger.payload.data[0].id}`, {
      method: 'PUT', headers: ownerHeaders, body: { reconciled: true },
    });
    assert.equal(reconcile.response.status, 200);
    const reconciledLedger = await request(baseUrl, `/organizations/${orgId}/treasury/accounts/${bank.payload.data._id}/ledger`, { headers: ownerHeaders });
    assert.equal(reconciledLedger.payload.data[0].reconciled, true);

    const cheque = await request(baseUrl, `/organizations/${orgId}/treasury/cheques`, {
      method: 'POST', headers: ownerHeaders,
      body: { chequeNumber: 'PDC-001', amount: '250.00', chequeDate: '2026-10-01T00:00:00.000Z', partyName: 'Example Customer', bankName: 'Test Bank Ltd', type: 'receive', remarks: 'E2E cheque' },
    });
    assert.equal(cheque.response.status, 201);
    const setChequeStatus = (status) => request(baseUrl, `/organizations/${orgId}/treasury/cheques/${cheque.payload.data._id}/status`, { method: 'PATCH', headers: ownerHeaders, body: { status } });
    assert.equal((await setChequeStatus('deposited')).response.status, 200);
    assert.equal((await setChequeStatus('cleared')).response.status, 200);
    assert.equal((await setChequeStatus('bounced')).response.status, 409);

    await request(baseUrl, '/auth/signup', {
      method: 'POST', body: { fullName: 'Other User', email: 'other@example.test', phone: '+9779800000002', password: 'OtherPass123' },
    });
    const otherLogin = await request(baseUrl, '/auth/login', { method: 'POST', body: { identifier: 'other@example.test', password: 'OtherPass123' } });
    const forbidden = await request(baseUrl, `/organizations/${orgId}/treasury/accounts`, { headers: { authorization: `Bearer ${otherLogin.payload.data.accessToken}` } });
    assert.equal(forbidden.response.status, 403);

    console.log('Database workflow checks passed: onboarding, tenant isolation, GL transfer, balances, PDC lifecycle, and reconciliation.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await replicaSet.stop({ doCleanup: true, force: true }).catch(() => undefined);
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
