import { FC, SVGAttributes } from 'react';

type CaretLeftIconProps = SVGAttributes<SVGSVGElement>;

const CaretLeftIcon: FC<CaretLeftIconProps> = (props) => {
  return (
    <svg
      width='26'
      height='27'
      viewBox='0 0 26 27'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M14.9229 20.7657L9.18881 15.0316C8.78263 14.6253 8.55444 14.0743 8.55444 13.4998C8.55444 12.9253 8.78263 12.3743 9.18881 11.968L14.9229 6.23389L16.4547 7.76572L10.725 13.4998L16.4591 19.2339L14.9229 20.7657Z'
        fill='#05141F'
      />
    </svg>
  );
};

export default CaretLeftIcon;
