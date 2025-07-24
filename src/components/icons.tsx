import Image from 'next/image';

export const Icons = {
  Logo: (props: { className?: string }) => (
    <Image
      src="/image/Logo.png"
      alt="RouteWise logo"
      width={685}
      height={165}
      className={props.className}
    />
  ),
};
