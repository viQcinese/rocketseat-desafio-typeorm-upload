import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // Get repositories
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // Handle Outcome Transactions
    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError(
        "You don't have enough money to make this transaction",
      );
    }

    // Handle Tag Creation
    let category_id;

    const foundCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!foundCategory) {
      const newCategory = categoriesRepository.create({ title: category });
      const savedCategory = await categoriesRepository.save(newCategory);
      category_id = savedCategory.id;
    } else {
      category_id = foundCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
