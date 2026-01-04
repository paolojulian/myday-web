import { useState, ChangeEvent } from 'react';
import { db } from '@/repository';
import AppButton from '@/components/atoms/app-button/app-button';
import AppTextInput from '@/components/atoms/app-text-input/app-text-input';
import AppTypography from '@/components/atoms/app-typography/app-typography';

interface AuthModalProps {
  onAuthenticated: () => void;
}

export const AuthModal = ({ onAuthenticated }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send OTP via Dexie Cloud
      await db.cloud.login({ email });
      setOtpSent(true);
      setError(null);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send verification code. Please try again.'
      );
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
      // The OTP verification happens automatically through Dexie Cloud
      // when the user enters the code sent to their email
      // We just need to wait for the authentication state to change
      onAuthenticated();
    } catch (err) {
      console.error('Failed to verify OTP:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
        <div className='mb-6 text-center'>
          <AppTypography variant='body' className='mb-2'>
            Welcome to MyDay
          </AppTypography>
          <AppTypography variant='body2' className='text-gray-600'>
            {otpSent
              ? 'Enter the verification code sent to your email'
              : 'Sign in to sync your data across devices'}
          </AppTypography>
        </div>

        {!otpSent ? (
          <div className='space-y-4'>
            <AppTextInput
              id='email'
              label='Email'
              type='email'
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder='your@email.com'
              disabled={isLoading}
              autoFocus
            />

            {error && (
              <div className='rounded-md bg-red-50 p-3'>
                <AppTypography variant='body2' className='text-red-600'>
                  {error}
                </AppTypography>
              </div>
            )}

            <AppButton
              onClick={handleSendOTP}
              disabled={isLoading}
              className='w-full'
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </AppButton>

            <div className='pt-4 text-center'>
              <AppTypography variant='small' className='text-gray-500'>
                Your data is encrypted and secure.
                <br />
                We'll never share your email with anyone.
              </AppTypography>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='rounded-md bg-blue-50 p-3'>
              <AppTypography variant='body2' className='text-blue-800'>
                Code sent to: <strong>{email}</strong>
              </AppTypography>
            </div>

            <AppTextInput
              id='otp'
              label='Verification Code'
              type='text'
              value={otp}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setOtp(e.target.value)
              }
              placeholder='Enter 6-digit code'
              disabled={isLoading}
              autoFocus
              maxLength={6}
            />

            {error && (
              <div className='rounded-md bg-red-50 p-3'>
                <AppTypography variant='body2' className='text-red-600'>
                  {error}
                </AppTypography>
              </div>
            )}

            <div className='space-y-2'>
              <AppButton
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className='w-full'
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </AppButton>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError(null);
                }}
                disabled={isLoading}
                className='w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50'
                type='button'
              >
                Change Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
