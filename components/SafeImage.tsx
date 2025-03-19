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
  const [isError, setIsError] = useState(false);
  const fallbackImage = "/placeholder.svg"; // フォールバックイメージのパス

  // URLが有効かチェック
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // ImgBBのURLを正規化
  const normalizeImgBBUrl = (url: string) => {
    if (!url) return fallbackImage;

    try {
      // URLが有効でない場合はフォールバック
      if (!isValidUrl(url)) return fallbackImage;

      // 基本的なプロトコル修正
      let normalizedUrl = url;
      if (url.startsWith("//")) {
        normalizedUrl = `https:${url}`;
      } else if (url.startsWith("http:")) {
        normalizedUrl = url.replace("http:", "https:");
      } else if (url.includes("ibb.co") && !url.startsWith("https:")) {
        normalizedUrl = `https://${url.replace(/^https?:\/\//, "")}`;
      }

      // ImgBBの標準URL形式に変換 (i.ibb.co/{ID}/{filename})
      if (normalizedUrl.includes("ibb.co")) {
        try {
          const urlObj = new URL(normalizedUrl);

          // i.ibb.coドメインを確保
          if (!urlObj.hostname.includes("i.ibb.co")) {
            urlObj.hostname = "i.ibb.co";
          }

          // パスを解析し、標準形式に変換
          const pathParts = urlObj.pathname.split("/").filter((p) => p);

          // 標準的なImgBBのIDパターン(7〜10文字程度)を抽出
          let imgId = "";
          for (const part of pathParts) {
            // 7〜10文字の英数字のパターンを検索
            const match = part.match(/^([a-zA-Z0-9]{7,10})/);
            if (match) {
              imgId = match[1];
              break;
            }
          }

          if (imgId) {
            // ファイル名部分を取得 (存在する場合)
            const filename = pathParts[pathParts.length - 1];

            // 重複する拡張子を削除
            let cleanFilename = filename;
            if (filename.endsWith(".webp.webp")) {
              cleanFilename = filename.replace(".webp.webp", ".webp");
            } else if (
              filename.includes(".webp") &&
              filename.endsWith(".webp")
            ) {
              const parts = filename.split(".webp");
              cleanFilename = parts[0] + ".webp";
            }

            // クリーンなURLを構築
            return `https://i.ibb.co/${imgId}/${cleanFilename}`;
          }
        } catch (e) {
          console.error("ImgBB URL解析エラー:", e);
        }
      }

      return normalizedUrl;
    } catch (e) {
      console.error("URL処理エラー:", e);
      return fallbackImage;
    }
  };

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
          <Image
            src={isError ? fallbackImage : normalizeImgBBUrl(src)}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setIsError(true)}
            unoptimized={true}
            priority={true}
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

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handleImageClick}>
        <Image
          src={isError ? fallbackImage : normalizeImgBBUrl(src)}
          alt={alt}
          width={typeof width === "string" ? parseInt(width, 10) : width}
          height={typeof height === "string" ? parseInt(height, 10) : height}
          onError={() => setIsError(true)}
          unoptimized={true}
          priority={true}
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
