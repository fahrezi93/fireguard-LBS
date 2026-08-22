"use client";

import { useState } from 'react';
import { FaBookOpen } from 'react-icons/fa';
import Image from 'next/image';

interface ArticleImageProps {
  src: string | null;
  alt: string;
}

export default function ArticleImage({ src, alt }: ArticleImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src);

  if (!imgSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <FaBookOpen className="text-4xl text-red-200/60" />
      </div>
    );
  }

  return (
    <Image 
      src={imgSrc} 
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={() => {
        setImgSrc("https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=1200&q=80");
      }}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
    />
  );
}
