import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}
export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 [&>button]:hidden">
        <DialogTitle className="sr-only">施設画像</DialogTitle>
        <DialogDescription className="sr-only">
          施設の詳細画像を拡大表示しています
        </DialogDescription>
        <div
          className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="w-full max-w-4xl flex flex-col items-center space-y-6">
            <div className="relative w-full h-[70vh] rounded-lg">
              <Image
                src={imageUrl}
                alt={alt}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 70vw"
              />
            </div>
            <p className="text-white text-center">画面をクリックで閉じる</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
