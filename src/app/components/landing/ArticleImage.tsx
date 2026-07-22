"use client";

import { FaBookOpen } from 'react-icons/fa';

interface ArticleImageProps {
  src: string | null;
  alt: string;
}

export default function ArticleImage({ src, alt }: ArticleImageProps) {
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <FaBookOpen className="text-4xl text-red-200/60" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=1200&q=80";
      }}
      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
    />
  );
}
