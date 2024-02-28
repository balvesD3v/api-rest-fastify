import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('user can to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transactions',
        amount: 4000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponde = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transactions',
        amount: 4000,
        type: 'credit',
      })

    const cookies = createTransactionResponde.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'new transactions',
        amount: 4000,
      }),
    ])
  })

  it('should be able to get a specific transactions', async () => {
    const createTransactionResponde = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transactions',
        amount: 4000,
        type: 'credit',
      })

    const cookies = createTransactionResponde.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transaction[0].id

    const GetTransactionsResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(GetTransactionsResponse.body.transactions).toEqual(
      expect.objectContaining({
        title: 'new transactions',
        amount: 4000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponde = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 2000,
        type: 'credit',
      })

    const cookies = createTransactionResponde.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 4000,
        type: 'credit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 4000,
    })
  })
})
