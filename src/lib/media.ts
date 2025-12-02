export const resolveServiceImageUrl = (image?: string | null) => {
  if (!image) return null;

  const trimmed = image.trim();
  if (!trimmed) return null;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const normalizedPath = trimmed.replace(/^\/+/, '');
  if (!base) {
    return `/uploads/${normalizedPath}`;
  }

  return `${base}/uploads/${normalizedPath}`;
};





