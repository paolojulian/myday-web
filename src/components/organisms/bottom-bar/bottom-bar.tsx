import { NavLink } from 'react-router-dom';
import CreateButton from './create-button';

const iconClass = 'w-5 h-5';

const HomeIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={iconClass}
  >
    <path d='M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z' />
    <path d='M9 21V12h6v9' />
  </svg>
);

const ExpensesIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={iconClass}
  >
    <rect x='2' y='5' width='20' height='14' rx='2' />
    <path d='M2 10h20' />
    <path d='M6 15h4' />
    <path d='M14 15h4' />
  </svg>
);

const CategoriesIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={iconClass}
  >
    <rect x='3' y='3' width='7' height='7' rx='1.5' />
    <rect x='14' y='3' width='7' height='7' rx='1.5' />
    <rect x='3' y='14' width='7' height='7' rx='1.5' />
    <rect x='14' y='14' width='7' height='7' rx='1.5' />
  </svg>
);

const SettingsIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={iconClass}
  >
    <circle cx='12' cy='12' r='3' />
    <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
  </svg>
);

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center gap-1 w-full h-full transition-transform active:scale-75 ${
    isActive ? 'text-neutral-900' : 'text-neutral-400'
  }`;

const ActiveDot = () => (
  <span className='absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neutral-900' />
);

const haptic = () => navigator.vibrate?.(8);

export default function BottomBar() {
  return (
    <div
      id='bottom-bar'
      className='fixed bottom-0 inset-x-0 z-(--z-bottom-bar) bg-white/80 backdrop-blur-md border-t border-neutral-100'
      style={{
        paddingBottom: 'var(--safe-area-inset-bottom)',
        paddingLeft: 'var(--safe-area-inset-left)',
        paddingRight: 'var(--safe-area-inset-right)',
      }}
    >
      <div className='grid grid-cols-5 h-16 px-2 pt-2'>
        {/* Home */}
        <NavLink to='/' end className={navItemClass} onClick={haptic}>
          {({ isActive }) => (
            <span className='relative flex items-center justify-center'>
              <HomeIcon />
              {isActive && <ActiveDot />}
            </span>
          )}
        </NavLink>

        {/* Expenses */}
        <NavLink to='/expenses' className={navItemClass} onClick={haptic}>
          {({ isActive }) => (
            <span className='relative flex items-center justify-center'>
              <ExpensesIcon />
              {isActive && <ActiveDot />}
            </span>
          )}
        </NavLink>

        {/* Create */}
        <div className='flex items-center justify-center'>
          <CreateButton />
        </div>

        {/* Categories */}
        <NavLink to='/categories' className={navItemClass} onClick={haptic}>
          {({ isActive }) => (
            <span className='relative flex items-center justify-center'>
              <CategoriesIcon />
              {isActive && <ActiveDot />}
            </span>
          )}
        </NavLink>

        {/* Settings */}
        <NavLink to='/settings' className={navItemClass} onClick={haptic}>
          {({ isActive }) => (
            <span className='relative flex items-center justify-center'>
              <SettingsIcon />
              {isActive && <ActiveDot />}
            </span>
          )}
        </NavLink>
      </div>
    </div>
  );
}
