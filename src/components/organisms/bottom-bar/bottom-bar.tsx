import { NavLink } from 'react-router-dom';
import CreateButton from './create-button';

export default function BottomBar() {
  return (
    <div
      id='bottom-bar'
      className='fixed bottom-0 bg-white inset-x-0 z-(--z-bottom-bar) rounded-full overflow-hidden pt-4'
    >
      <div className='grid grid-cols-5 mb-6 mx-6 h-16'>
        <div className='p-2 flex items-center justify-center'>
          <NavLink to='/'>H</NavLink>
        </div>
        <div className='p-2 pr-4 flex items-center justify-center'>
          <NavLink to='/expenses'>E</NavLink>
        </div>
        <div>
          <CreateButton />
        </div>
        <div className='p-2 pl-4 flex items-center justify-center'>
          <NavLink to='/'>T</NavLink>
        </div>
        <div className='p-2 flex items-center justify-center'>
          <NavLink to='/expenses'>S</NavLink>
        </div>
      </div>
    </div>
  );
}
