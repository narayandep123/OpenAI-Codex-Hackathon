"use client";

import { useMemo, useState } from "react";
import { getHospitalFallbackImage, resolveHospitalImageUrl } from "@/lib/hospital-images";

interface HospitalImageProps {
  imageUrl?: string;
  seed: string;
  alt: string;
  className?: string;
}

export default function HospitalImage({ imageUrl, seed, alt, className }: HospitalImageProps) {
  const [fallbackOffset, setFallbackOffset] = useState(0);

  const src = useMemo(() => {
    if (fallbackOffset > 0) {
      return getHospitalFallbackImage(seed, fallbackOffset);
    }

    return resolveHospitalImageUrl(imageUrl, seed);
  }, [fallbackOffset, imageUrl, seed]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFallbackOffset((current) => current + 1)}
    />
  );
}