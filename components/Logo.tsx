import Image from 'next/image';

// Emblema oficial de la Polla Mundial 2026: trofeo dorado sobre el "26".
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Polla Mundial 2026"
      width={size}
      height={size}
      priority
      style={{ display: 'block', flexShrink: 0, borderRadius: size * 0.22 }}
    />
  );
}
