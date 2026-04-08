import { AppBottomSheet } from '@/components/atoms/app-bottom-sheet';
import AppTextInput from '@/components/atoms/app-text-input';
import AppTypography from '@/components/atoms/app-typography';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateCategory } from '@/hooks/categories/use-create-category';
import { useTopCategories } from '@/hooks/categories/use-top-categories';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import cn from '@/utils/cn';
import { useMemo, useRef, useState } from 'react';
import { Control, Controller } from 'react-hook-form';

type Props = {
  onFocusDescriptionInput: () => void;
  control: Control<ExpenseFormData>;
};

const CategoryField = ({ onFocusDescriptionInput, control }: Props) => {
  const { data: categories = [] } = useCategories();
  const { data: topCategories = [] } = useTopCategories(5);
  const createCategory = useCreateCategory();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const showCustomOption = useMemo(() => {
    if (!searchQuery) return false;
    return !filteredCategories.some(
      (c) => c.name.toLowerCase() === searchQuery.toLowerCase()
    );
  }, [searchQuery, filteredCategories]);

  const handleSelect = (value: string, onChange: (v: string | null) => void) => {
    onChange(value || null);
    setIsPickerOpen(false);
    setSearchQuery('');
    onFocusDescriptionInput();
  };

  const handleCreateAndSelect = async (
    name: string,
    onChange: (v: string | null) => void
  ) => {
    try {
      const newCategory = await createCategory.execute({ name });
      if (newCategory?.id) {
        onChange(newCategory.id);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      onChange(null);
    }
    setIsPickerOpen(false);
    setSearchQuery('');
    onFocusDescriptionInput();
  };

  const handlePickerOpen = () => {
    setIsPickerOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 520);
  };

  return (
    <section>
      <Controller
        name='category'
        control={control}
        rules={{ required: 'Category is required' }}
        render={({ field, fieldState }) => {
          const isOthersActive =
            !!field.value &&
            !topCategories.some((c) => c.id === field.value);
          const selectedNonTopCategory = isOthersActive
            ? categories.find((c) => c.id === field.value)
            : null;

          return (
            <>
              {fieldState.error && (
                <div className='mb-2'>
                  <AppTypography
                    as='span'
                    variant='small'
                    className='font-bold text-red-500'
                  >
                    {fieldState.error.message}
                  </AppTypography>
                </div>
              )}

              <div className='flex flex-wrap gap-2'>
                {topCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type='button'
                    onClick={() => handleSelect(cat.id!, field.onChange)}
                    className={cn(
                      'group relative z-0 flex-1',
                      {
                        'text-black': field.value === cat.id,
                        'text-neutral-600': field.value !== cat.id,
                      }
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 group-active:scale-90 transition-all -z-10 rounded',
                        {
                          'bg-emerald-50 outline outline-emerald-500': field.value === cat.id,
                          'bg-neutral-100': field.value !== cat.id,
                        }
                      )}
                    />
                    <div className='px-4 py-4 text-sm text-center truncate'>{cat.name}</div>
                  </button>
                ))}

                <button
                  type='button'
                  onClick={handlePickerOpen}
                  className={cn(
                    'group relative z-0 flex-1',
                    {
                      'text-black': isOthersActive,
                      'text-neutral-600': !isOthersActive,
                    }
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-0 group-active:scale-90 transition-all -z-10 rounded',
                      {
                        'bg-emerald-50 outline outline-emerald-500': isOthersActive,
                        'bg-neutral-100': !isOthersActive,
                      }
                    )}
                  />
                  <div className='px-4 py-4 text-sm text-center truncate'>
                    {selectedNonTopCategory?.name ?? 'Others'}
                  </div>
                </button>
              </div>

              <AppBottomSheet
                isOpen={isPickerOpen}
                onClose={() => {
                  setIsPickerOpen(false);
                  setSearchQuery('');
                }}
                title='Category'
                height='60%'
                variant='custom'
                shouldHideHeader
                zIndex={1002}
              >
                <div className='flex flex-col gap-4'>
                  <AppTextInput
                    id='category-search'
                    label='Search'
                    placeholder='Search categories...'
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(String(text || ''))}
                    ref={searchInputRef}
                  />

                  <div className='flex flex-col gap-1 pb-2'>
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type='button'
                        onClick={() => handleSelect(cat.id!, field.onChange)}
                        className={cn(
                          'px-4 py-3 rounded-lg text-left transition-all',
                          'hover:bg-neutral-100 active:scale-95',
                          {
                            'bg-emerald-50 text-emerald-700 font-semibold':
                              field.value === cat.id,
                            'text-black': field.value !== cat.id,
                          }
                        )}
                      >
                        <AppTypography variant='body'>{cat.name}</AppTypography>
                      </button>
                    ))}

                    {showCustomOption && (
                      <button
                        type='button'
                        onClick={() =>
                          handleCreateAndSelect(searchQuery, field.onChange)
                        }
                        className={cn(
                          'px-4 py-3 rounded-lg text-left transition-all',
                          'border-2 border-dashed border-neutral-300',
                          'hover:bg-neutral-50 active:scale-95',
                          'flex items-center gap-2'
                        )}
                      >
                        <AppTypography
                          variant='body'
                          className='text-neutral-600'
                        >
                          Create: &quot;
                          <span className='font-semibold text-black'>
                            {searchQuery}
                          </span>
                          &quot;
                        </AppTypography>
                      </button>
                    )}

                    {filteredCategories.length === 0 && !showCustomOption && (
                      <div className='px-4 py-8 text-center'>
                        <AppTypography
                          variant='body'
                          className='text-neutral-400'
                        >
                          No options found
                        </AppTypography>
                      </div>
                    )}
                  </div>
                </div>
              </AppBottomSheet>
            </>
          );
        }}
      />
    </section>
  );
};

export default CategoryField;
