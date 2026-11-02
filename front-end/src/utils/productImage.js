export const PRODUCT_IMAGE_PLACEHOLDER = '/demo-assets/product-placeholder.svg';

// Frontend public assets and backend uploads have different origins.
export function resolveProductImage(value, apiBase = process.env.REACT_APP_API_URL || 'http://localhost:9999') {
  if (typeof value !== 'string' || !value.trim()) return PRODUCT_IMAGE_PLACEHOLDER;
  const image = value.trim();
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/demo-assets/')) return image;
  if (/^[a-z][a-z0-9+.-]*:/i.test(image) || image.startsWith('//')) return PRODUCT_IMAGE_PLACEHOLDER;
  const base = apiBase.replace(/\/+$/, '').replace(/\/api$/, '');
  return base + '/uploads/' + image.replace(/^\/?uploads\//, '').replace(/^\/+/, '');
}

export function productImageFallback(event) {
  const image = event.currentTarget;
  if (image.getAttribute('src') !== PRODUCT_IMAGE_PLACEHOLDER) image.setAttribute('src', PRODUCT_IMAGE_PLACEHOLDER);
}
