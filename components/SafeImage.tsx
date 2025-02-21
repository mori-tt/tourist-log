import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  [x: string]: any;
}

export default function SafeImage({ src, alt, ...props }: SafeImageProps) {
  if (!src) return null;
  return <Image src={src} alt={alt} {...props} />;
}
