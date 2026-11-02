import { api } from './index';
export async function uploadProductImage(file) {
  if (!['image/jpeg','image/png','image/gif','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Chọn ảnh JPEG, PNG, GIF hoặc WebP tối đa 5 MB');
  const body = new FormData(); body.append('image', file);
  const response = await api.post('images/upload', body);
  return response.data.data.secure_url;
}
