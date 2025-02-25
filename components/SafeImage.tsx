import React from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  ...props
}: SafeImageProps) {
  if (!src || src.trim() === "") return null;

  // 幅・高さ、または fill の指定がない場合は、デフォルトで fill モードとする
  if (!width && !height && !props.fill) {
    return (
      <div className="relative w-full h-64">
        <Image src={src} alt={alt} fill className="object-cover" {...props} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={typeof width === "string" ? parseInt(width, 10) : width}
      height={typeof height === "string" ? parseInt(height, 10) : height}
      {...props}
    />
  );
}
