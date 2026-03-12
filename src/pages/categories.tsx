import { AppPageHeader } from '@/components/atoms';
import AppTypography from '@/components/atoms/app-typography';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateCategory } from '@/hooks/categories/use-create-category';
import { useDeleteCategory } from '@/hooks/categories/use-delete-category';
import { FC, useState } from 'react';

const Categories: FC = () => {
  const [newName, setNewName] = useState('');
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createCategory.execute({ name: trimmed });
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div>
      <AppPageHeader title='My Day' description='Categories' />

      {/* Add new category */}
      <div className='flex gap-2 mt-4 mb-6'>
        <input
          type='text'
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='New category name'
          className='flex-1 border border-neutral-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-500'
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || createCategory.isPending}
          className='px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium disabled:opacity-40'
        >
          Add
        </button>
      </div>

      {/* Category list */}
      {isLoading && (
        <AppTypography
          variant='body2'
          className='text-neutral-500 text-center py-8'
        >
          Loading...
        </AppTypography>
      )}

      {!isLoading && categories?.length === 0 && (
        <AppTypography
          variant='body2'
          className='text-neutral-500 text-center py-8'
        >
          No categories yet
        </AppTypography>
      )}

      <div className='flex flex-col gap-2'>
        {categories?.map((category) => (
          <div
            key={category.id}
            className='flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3'
          >
            <div className='flex items-center gap-3'>
              {/* Tag icon */}
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='w-4 h-4 text-orange-500'
              >
                <path
                  fillRule='evenodd'
                  d='M5.25 2.25a3 3 0 0 0-3 3v4.318a3 3 0 0 0 .879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 0 0 5.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 0 0-2.121-.879H5.25ZM6.375 7.5a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z'
                  clipRule='evenodd'
                />
              </svg>
              <AppTypography
                variant='body'
                className='font-medium text-neutral-900'
              >
                {category.name}
              </AppTypography>
            </div>
            <button
              onClick={() => category.id && deleteCategory.execute(category.id)}
              disabled={deleteCategory.isPending}
              className='p-2 text-neutral-400 hover:text-red-500 transition-colors'
              aria-label={`Delete ${category.name}`}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='w-4 h-4'
              >
                <path
                  fillRule='evenodd'
                  d='M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
