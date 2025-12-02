import { FC } from 'react';

type AppSplashScreenProps = {
  isLoading?: boolean;
};

const AppSplashScreen: FC<AppSplashScreenProps> = ({ isLoading = true }) => {
  if (!isLoading) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-white'>
      <div className='flex flex-col items-center gap-6'>
        {/* Logo */}
        <div className='relative'>
          <img
            src='/favicon-196x196.png'
            alt='My Day'
            className='h-24 w-24'
          />
        </div>

        {/* App Name */}
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-neutral-900'>My Day</h1>
          <p className='mt-2 text-sm text-neutral-500'>Loading your data...</p>
        </div>

        {/* Loading Spinner */}
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]'></div>
          <div className='h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]'></div>
          <div className='h-2 w-2 animate-bounce rounded-full bg-orange-500'></div>
        </div>
      </div>
    </div>
  );
};

export default AppSplashScreen;
