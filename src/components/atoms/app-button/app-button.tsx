import { ButtonHTMLAttributes, FC } from 'react';

type AppButtonProps = {
  hasHapticFeedback?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const AppButton: FC<AppButtonProps> = ({ hasHapticFeedback = false, onClick, ...props }) => {
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (e) => {
    if (hasHapticFeedback) {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      } else {
        console.warn('Vibration API not supported');
      }
    }

    onClick?.(e);
  }

  return (
    <button onClick={handleClick} {...props}>
    </button>
  );
};

export default AppButton;