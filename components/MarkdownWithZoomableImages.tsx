import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkImageAttributes from "remark-image-attributes";
import SafeImage from "./SafeImage";

interface MarkdownWithZoomableImagesProps {
  content: string;
}

export default function MarkdownWithZoomableImages({
  content,
}: MarkdownWithZoomableImagesProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkImageAttributes]}
      components={{
        img: ({ node, ...props }) => {
          const { src, alt = "記事の画像" } = props;

          if (!src) return null;

          return (
            <div className="my-4">
              <SafeImage
                src={src}
                alt={alt}
                width={600}
                height={400}
                className="object-contain mx-auto"
              />
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
