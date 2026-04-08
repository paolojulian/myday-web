import { AppButton, AppPageHeader } from '@/components/atoms';
import AppTypography from '@/components/atoms/app-typography';
import { PTypography } from '@paolojulian.dev/design-system';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateCategory } from '@/hooks/categories/use-create-category';
import { useDeleteCategory } from '@/hooks/categories/use-delete-category';
import { useCategorySpendingLive } from '@/hooks/expenses/use-category-spending-live';
import { toCurrency } from '@/lib/currency.utils';
import { FC, useRef, useMemo, useState } from 'react';

const Categories: FC = () => {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const currentMonth = useMemo(() => new Date(), []);
  const categorySpending = useCategorySpendingLive(currentMonth);
  const maxSpending = categorySpending[0]?.total ?? 0;

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    deleteCategory.execute(id);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createCategory.execute({ name: trimmed });
    setNewName('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className='pb-44'>
      <AppPageHeader title='Xpense' description='Categories' />

      {/* Spending chart — horizontal scroll */}
      {categorySpending.length > 0 && (
        <div className='mt-4 mb-6'>
          <PTypography
            variant='body-wide'
            className='text-neutral-400 uppercase mb-2'
          >
            This month
          </PTypography>
          <div className='flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4'>
            {categorySpending.map((item) => (
              <div
                key={item.categoryId ?? '__uncategorized__'}
                className='flex-shrink-0 w-32 bg-neutral-50 rounded-xl p-3'
              >
                <AppTypography
                  variant='small'
                  className='text-neutral-500 truncate block mb-1'
                >
                  {item.categoryName}
                </AppTypography>
                <AppTypography
                  variant='body'
                  className='font-bold text-neutral-900 text-sm'
                >
                  {toCurrency(item.total)}
                </AppTypography>
                <div className='mt-2 h-1.5 rounded-full bg-neutral-200 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-orange-400'
                    style={{
                      width: `${maxSpending > 0 ? (item.total / maxSpending) * 100 : 0}%`,
                    }}
                  />
                </div>
                <AppTypography
                  variant='small'
                  className='text-neutral-400 mt-1'
                >
                  {item.percentage.toFixed(0)}%
                </AppTypography>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category list */}
      {isLoading && (
        <AppTypography
          variant='small'
          className='text-neutral-400 text-center py-8'
        >
          Loading...
        </AppTypography>
      )}

      {!isLoading && categories?.length === 0 && (
        <div className='text-center py-16'>
          <AppTypography variant='small' className='text-neutral-400'>
            No categories yet — add one below
          </AppTypography>
        </div>
      )}

      <div className='flex flex-col gap-2'>
        {categories?.map((category) => (
          <div
            key={category.id}
            className='flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3'
          >
            <div className='flex items-center gap-3'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='w-4 h-4 text-emerald-500'
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
            <AppButton
              variant='ghost'
              size='sm'
              onClick={() =>
                category.id && handleDelete(category.id, category.name)
              }
              disabled={deleteCategory.isPending}
              aria-label={`Delete ${category.name}`}
              className='text-neutral-400 hover:text-red-500'
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
            </AppButton>
          </div>
        ))}
      </div>

      {/* Add category — fixed floating bar at bottom */}
      <div
        className='fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-neutral-100 px-4 pt-3 pb-3'
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
        }}
      >
        <div className='flex gap-2'>
          <input
            ref={inputRef}
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='New category name'
            className='flex-1 bg-neutral-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300'
          />
          <AppButton
            onClick={handleAdd}
            disabled={!newName.trim() || createCategory.isPending}
            variant='solid'
            size='md'
          >
            Add
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default Categories;
