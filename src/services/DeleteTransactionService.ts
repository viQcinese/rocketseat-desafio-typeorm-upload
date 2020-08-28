import { getCustomRepository, TransactionRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute({ id }: { id: string }): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne({ where: { id } });

    if (!transaction) {
      throw new AppError('No transaction found with given id');
    }

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
