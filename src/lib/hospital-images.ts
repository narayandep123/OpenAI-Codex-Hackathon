const HOSPITAL_IMAGE_POOL = [
  "https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/6129688/pexels-photo-6129688.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/127873/pexels-photo-127873.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/3259629/pexels-photo-3259629.jpeg?auto=compress&cs=tinysrgb&w=1600",
];

function hashSeed(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return hash;
}

function isPlaceholderImage(url: string) {
  const normalized = url.toLowerCase();

  return (
    normalized.includes("placehold.co") ||
    normalized.includes("via.placeholder") ||
    normalized.includes("placeholder")
  );
}

export function getHospitalFallbackImage(seed: string, offset = 0) {
  const baseIndex = hashSeed(seed) % HOSPITAL_IMAGE_POOL.length;
  const finalIndex = (baseIndex + Math.max(0, offset)) % HOSPITAL_IMAGE_POOL.length;

  return HOSPITAL_IMAGE_POOL[finalIndex];
}

export function resolveHospitalImageUrl(imageUrl: string | undefined, seed: string) {
  if (!imageUrl || isPlaceholderImage(imageUrl)) {
    return getHospitalFallbackImage(seed);
  }

  return imageUrl;
}