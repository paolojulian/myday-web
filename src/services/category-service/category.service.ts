import { DBError } from '../../config/errors.constants';
import { handleError } from '../../lib/handle-error.utils';
import { db, type Category } from '../../repository';

type AddCategoryParams = Omit<Category, 'id' | 'created_at'>;

class CategoryService {
  public async add(categoryToAdd: AddCategoryParams): Promise<{ error: Error | null; category?: Category }> {
    const dateNow = new Date();

    try {
      const id = await db.categories.add({
        ...categoryToAdd,
        created_at: dateNow,
      });

      // Fetch the created category to return it with the ID
      const category = await db.categories.get(id);

      return { error: null, category };
    } catch (e) {
      return { error: handleError(e, new DBError('Unable to add category')) };
    }
  }

  public async list(): Promise<Category[]> {
    const categories = await db.categories
      .orderBy('name')
      .toArray();

    return categories;
  }

  public async getById(id: number): Promise<Category | undefined> {
    return await db.categories.get(id);
  }

  public async delete(id: number): Promise<Error | null> {
    try {
      await db.categories.delete(id);
      return null;
    } catch (e) {
      return handleError(e, new DBError('Unable to delete category'));
    }
  }

  public async seedDefaultCategories(): Promise<void> {
    const count = await db.categories.count();

    // Only seed if no categories exist
    if (count > 0) {
      return;
    }

    const defaultCategories = [
      'Food',
      'Shopping',
      'Bills',
      'Transportation',
      'Entertainment',
      'Health',
      'Education',
      'Other',
    ];

    const categoriesToAdd = defaultCategories.map((name) => ({
      name,
      created_at: new Date(),
    }));

    await db.categories.bulkAdd(categoriesToAdd);
    console.log('Default categories seeded successfully');
  }
}

export const categoryService = new CategoryService();
