import { AppBottomSheet } from '@/components/atoms/app-bottom-sheet';
import AppTextInput from '@/components/atoms/app-text-input';
import AppTypography from '@/components/atoms/app-typography';
import ChevronDownIcon from '@/components/atoms/icons/chevron-down-icon';
import cn from '@/utils/cn';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

export type PickerOption = {
  label: string;
  value: string;
};

type AppPickerProps = {
  id: string;
  label: string;
  placeholder?: string;
  options: PickerOption[];
  value?: string;
  onChange?: (value: string) => void;
  isFullWidth?: boolean;
  errorMessage?: string;
  allowCustom?: boolean;
  searchPlaceholder?: string;
};

const AppPicker: FC<AppPickerProps> = ({
  id,
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  isFullWidth = true,
  errorMessage,
  allowCustom = false,
  searchPlaceholder = 'Search...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hasValue = !!value;
  const hasError = !!errorMessage;
  const resolvedLabel = hasError && errorMessage ? errorMessage : label;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || value || placeholder;

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  // Check if we should show the custom input option
  const showCustomOption = useMemo(() => {
    if (!allowCustom || !searchQuery) return false;
    // Show custom option if search query doesn't match any existing option
    return !filteredOptions.some(
      (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase()
    );
  }, [allowCustom, searchQuery, filteredOptions]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCustomInput = () => {
    if (searchQuery.trim()) {
      onChange?.(searchQuery.trim());
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <>
      <div
        data-element-name='AppPicker'
        className={cn('relative', 'group', {
          'w-full': isFullWidth,
        })}
      >
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          id={id}
          className={cn(
            'peer',
            'relative z-10',
            'pt-6 px-4 pb-2 bg-neutral-100 rounded',
            'text-base font-normal leading-normal',
            'flex items-center justify-between gap-2',
            'text-left',
            {
              'w-full': isFullWidth,
              'border-red-500 outline outline-red-500': hasError,
              'text-neutral-400': !hasValue,
              'text-black': hasValue,
            }
          )}
        >
          <span className='flex-1'>{displayValue}</span>
        </button>

        <ChevronDownIcon
          className={cn(
            'absolute right-4 z-20 top-1/2 -translate-y-1/2',
            'w-5 h-5 text-neutral-500 flex-shrink-0 self-center'
          )}
        />

        {/* Label - always visible at top */}
        <label
          aria-label={id}
          htmlFor={id}
          className={cn('absolute left-4 top-1 z-20', 'pointer-events-none', {
            'text-red-500': hasError,
            'text-neutral-500': !hasError,
          })}
        >
          <AppTypography
            as='span'
            variant='small'
            className={cn('font-bold', {
              'text-red-500': hasError,
            })}
          >
            {resolvedLabel}
          </AppTypography>
        </label>
      </div>

      {/* Bottom Sheet Picker */}
      <AppBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={label}
        height='70%'
        variant='custom'
        zIndex={1002}
      >
        <div
          className='flex flex-col gap-4'
          style={{ height: 'calc(70vh - 100px)' }}
        >
          {/* Search Input */}
          <AppTextInput
            id={`${id}-search`}
            label='Search'
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(String(text || ''))}
            ref={inputRef}
          />

          {/* Options List with Gradient */}
          <div className='relative flex-1 min-h-0'>
            <div className='flex flex-col gap-1 h-full overflow-y-auto pb-2 pr-1'>
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-left transition-all',
                    'hover:bg-neutral-100 active:scale-95',
                    {
                      'bg-orange-50 text-orange-700 font-semibold':
                        value === option.value,
                      'text-black': value !== option.value,
                    }
                  )}
                >
                  <AppTypography variant='body'>{option.label}</AppTypography>
                </button>
              ))}

              {/* Custom Input Option */}
              {showCustomOption && (
                <button
                  type='button'
                  onClick={handleCustomInput}
                  className={cn(
                    'px-4 py-3 rounded-lg text-left transition-all',
                    'border-2 border-dashed border-neutral-300',
                    'hover:bg-neutral-50 active:scale-95',
                    'flex items-center gap-2'
                  )}
                >
                  <AppTypography variant='body' className='text-neutral-600'>
                    Create: "
                    <span className='font-semibold text-black'>
                      {searchQuery}
                    </span>
                    "
                  </AppTypography>
                </button>
              )}

              {/* No Results */}
              {filteredOptions.length === 0 && !showCustomOption && (
                <div className='px-4 py-8 text-center'>
                  <AppTypography variant='body' className='text-neutral-400'>
                    No options found
                  </AppTypography>
                </div>
              )}
            </div>

            {/* Bottom gradient fade */}
            {filteredOptions.length > 5 && (
              <div className='absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none' />
            )}
          </div>
        </div>
      </AppBottomSheet>
    </>
  );
};

export default AppPicker;
