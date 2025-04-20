import CreateButton from "./create-button";

export default function BottomBar() {
  return (
    <div
      id="bottom-bar"
      className='fixed bottom-6 inset-x-6 z-(--z-bottom-bar) h-16 rounded-full overflow-hidden'
    >
      <div className='border border-black w-full h-full rounded-full'>
        <CreateButton />
      </div>
    </div>
  );
}
