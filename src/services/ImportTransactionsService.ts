import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionRequest {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
  category_id?: string;
}

class ImportTransactionsService {
  async execute({ filePath }: { filePath: string }): Promise<Transaction[]> {
    // REPOSITORIES
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // READ FILE
    const readStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readStream.pipe(parseStream);

    const transactions = [] as TransactionRequest[];
    const categories = [] as string[];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    // HANDLE CATEGORIES
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => {
        return category.title;
      },
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const transactionsToSave = transactions.map(transaction => {
      const Foundcategory = finalCategories.find(
        category => category.title === transaction.category,
      );
      if (Foundcategory) transaction.category_id = Foundcategory.id;
      return transaction;
    });

    const createdTransactions = transactionsRepository.create(
      transactionsToSave,
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
