import { AppPicker, AppPickerRef } from '@/components/atoms/app-picker';
import { useCategories } from '@/hooks/categories/use-categories';
import { useCreateCategory } from '@/hooks/categories/use-create-category';
import { ExpenseFormData } from '@/hooks/expenses/use-expense-form';
import { useMemo } from 'react';
import { Control, Controller } from 'react-hook-form';

type Props = {
  onFocusDescriptionInput: () => void;
  control: Control<ExpenseFormData>;
  categoryPickerRef: React.RefObject<AppPickerRef | null>;
};

const CategoryField = ({
  onFocusDescriptionInput,
  categoryPickerRef,
  control,
}: Props) => {
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();
  const createCategory = useCreateCategory();

  // Convert categories to picker options
  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: String(category.id || ''),
    }));
  }, [categories]);

  const handleCategoryChange = async (
    value: string,
    onChange: (value: string | null) => void
  ) => {
    // Check if this is a new category (not in existing options)
    const isExisting: boolean = categories.some((cat) => cat.id === value);

    if (!isExisting && value) {
      // Create new category - value is the category name
      try {
        const newCategory = await createCategory.execute({ name: value });
        if (newCategory?.id) {
          onChange(newCategory.id);
        }
        onFocusDescriptionInput();
      } catch (error) {
        console.error('Failed to create category:', error);
        onChange(null);
      }
      return;
    }

    onChange(value || null);
    onFocusDescriptionInput();
  };

  return (
    <section>
      <Controller
        name='category'
        control={control}
        rules={{ required: 'Category is required' }}
        render={({ field, fieldState }) => (
          <AppPicker
            ref={categoryPickerRef}
            id='category'
            label='Category'
            errorMessage={fieldState.error?.message}
            shouldHideHeader
            placeholder={
              isCategoriesLoading ? 'Loading...' : 'Select or create a category'
            }
            options={categoryOptions}
            value={field.value !== null ? String(field.value) : undefined}
            onChange={(value) => handleCategoryChange(value, field.onChange)}
            allowCustom
            searchPlaceholder='Search categories...'
          />
        )}
      />
    </section>
  );
};

export default CategoryField;
