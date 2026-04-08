import { AppPageHeader } from '@/components/atoms';
import AppTypography from '@/components/atoms/app-typography';
import { db } from '@/repository';
import { useDexieSync } from '@/hooks/use-dexie-sync';
import { FC, useState, ChangeEvent } from 'react';

const Settings: FC = () => {
  const { syncEnabled, syncState, userEmail, isAuthenticated } = useDexieSync();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSync = () => {
    if (syncEnabled) {
      localStorage.removeItem('myday_sync_enabled');
    } else {
      localStorage.setItem('myday_sync_enabled', 'true');
    }
    window.location.reload();
  };

  const handleSendOTP = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await db.cloud.login({ email });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the verification code');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await db.cloud.login({ email, otp });
      setOtpSent(false);
      setOtp('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await db.cloud.logout();
  };

  return (
    <div>
      <AppPageHeader title='Xpense' description='Settings' />

      {/* Sync section */}
      <div className='mt-6'>
        <AppTypography variant='small' className='text-neutral-500 mb-3 font-medium uppercase tracking-wide'>
          Cloud Sync
        </AppTypography>

        <div className='bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between'>
          <div>
            <AppTypography variant='body' className='font-medium text-neutral-900'>
              Sync across devices
            </AppTypography>
            <AppTypography variant='small' className='text-neutral-500'>
              {syncEnabled ? `Status: ${syncState}` : 'Off — data is stored locally'}
            </AppTypography>
          </div>
          <button
            onClick={handleToggleSync}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              syncEnabled ? 'bg-neutral-900' : 'bg-neutral-300'
            }`}
            aria-label='Toggle sync'
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                syncEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auth section — only shown when sync is enabled */}
        {syncEnabled && (
          <div className='mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4'>
            {isAuthenticated && userEmail ? (
              <div className='flex items-center justify-between'>
                <div>
                  <AppTypography variant='small' className='text-neutral-500 mb-0.5'>
                    Signed in as
                  </AppTypography>
                  <AppTypography variant='body' className='font-medium text-neutral-900'>
                    {userEmail}
                  </AppTypography>
                </div>
                <button
                  onClick={handleSignOut}
                  className='px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors'
                >
                  Sign out
                </button>
              </div>
            ) : !otpSent ? (
              <div className='space-y-3'>
                <AppTypography variant='body' className='font-medium text-neutral-900 mb-1'>
                  Sign in to sync
                </AppTypography>
                <input
                  type='email'
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  placeholder='your@email.com'
                  disabled={isLoading}
                  className='w-full border border-neutral-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-500 disabled:opacity-50'
                />
                {error && (
                  <AppTypography variant='small' className='text-red-600'>
                    {error}
                  </AppTypography>
                )}
                <button
                  onClick={handleSendOTP}
                  disabled={isLoading || !email}
                  className='w-full px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium disabled:opacity-40'
                >
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <AppTypography variant='body' className='font-medium text-neutral-900 mb-1'>
                  Enter verification code
                </AppTypography>
                <AppTypography variant='small' className='text-neutral-500'>
                  Code sent to <strong>{email}</strong>
                </AppTypography>
                <input
                  type='text'
                  value={otp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  placeholder='6-digit code'
                  maxLength={6}
                  disabled={isLoading}
                  className='w-full border border-neutral-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-neutral-500 disabled:opacity-50'
                />
                {error && (
                  <AppTypography variant='small' className='text-red-600'>
                    {error}
                  </AppTypography>
                )}
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length < 6}
                  className='w-full px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium disabled:opacity-40'
                >
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(''); setError(null); }}
                  className='w-full text-sm text-neutral-500 hover:text-neutral-700'
                >
                  Change email
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
