import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find();

  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const createTransactionService = new CreateTransactionService();

  const newTransaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(newTransaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  return response.send();
});

transactionsRouter.post('/import', async (request, response) => {
  return response.send();
});

export default transactionsRouter;
