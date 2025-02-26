import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import ImageModal from "./ImageModal";

interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  disableZoom?: boolean;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  disableZoom = false,
  ...props
}: SafeImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!src || src.trim() === "") return null;

  const handleImageClick = () => {
    if (!disableZoom) {
      setIsModalOpen(true);
    }
  };

  // 幅・高さが指定されていない場合、またはfillモードの場合は、fillモード用のラッパーを利用する
  if (!width && !height) {
    return (
      <>
        <div
          className="relative w-full aspect-[4/3] overflow-hidden group cursor-pointer"
          onClick={handleImageClick}
        >
          <Image src={src} alt={alt} fill className="object-cover" {...props} />
          {!disableZoom && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity pointer-events-none">
              <span className="bg-black/60 text-white px-2 py-1 rounded text-sm">
                画像をクリックすると拡大
              </span>
            </div>
          )}
        </div>
        {!disableZoom && (
          <ImageModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            imageUrl={src}
            alt={alt}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handleImageClick}>
        <Image
          src={src}
          alt={alt}
          width={typeof width === "string" ? parseInt(width, 10) : width}
          height={typeof height === "string" ? parseInt(height, 10) : height}
          {...props}
        />
        {!disableZoom && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity pointer-events-none">
            <span className="bg-black/60 text-white px-2 py-1 rounded text-sm">
              画像をクリックすると拡大
            </span>
          </div>
        )}
      </div>
      {!disableZoom && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageUrl={src}
          alt={alt}
        />
      )}
    </>
  );
}
