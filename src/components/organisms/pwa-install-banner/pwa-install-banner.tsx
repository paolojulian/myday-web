import { usePwaInstall } from '@/hooks/use-pwa-install';

export const PwaInstallBanner = () => {
  const { canInstall, isIOS, install, dismiss } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <div className='fixed bottom-[80px] left-0 right-0 px-4 pb-2 z-40'>
      <div className='bg-white rounded-xl shadow-lg border border-neutral-200 p-4 flex items-start gap-3'>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-neutral-900'>
            Add to Home Screen
          </p>
          {isIOS ? (
            <p className='text-xs text-neutral-500 mt-0.5'>
              Tap the share button{' '}
              <span className='font-medium text-neutral-700'>⎙</span> then
              select &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className='text-xs text-neutral-500 mt-0.5'>
              Install Xpense for quick access — works offline too
            </p>
          )}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            type='button'
            onClick={dismiss}
            className='px-3 py-1.5 text-sm text-neutral-500 bg-neutral-100 rounded-lg active:scale-95 transition-all'
          >
            No
          </button>
          {!isIOS && (
            <button
              type='button'
              onClick={install}
              className='px-3 py-1.5 text-sm font-medium text-white bg-emerald-500 rounded-lg active:scale-95 transition-all'
            >
              Add
            </button>
          )}
          {isIOS && (
            <button
              type='button'
              onClick={dismiss}
              className='px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg active:scale-95 transition-all'
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
