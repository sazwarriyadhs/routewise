import Image from 'next/image';

export const Icons = {
  Logo: (props: { className?: string }) => (
    <Image
      src="/Logo.png"
      alt="RouteWise logo"
      width={96}
      height={96}
      className={props.className}
    />
  ),
};
