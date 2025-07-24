import Image from 'next/image';

export const Icons = {
  Logo: (props: { className?: string }) => (
    <Image
      src="/logo.png"
      alt="RouteWise logo"
      width={24}
      height={24}
      className={props.className}
    />
  ),
};
