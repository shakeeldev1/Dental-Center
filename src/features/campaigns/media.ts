import { apiFetch } from '@/lib/api';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — comfortably under WGL's own attachment limits

/**
 * Uploads a campaign image via the backend (which signs and forwards it to
 * Cloudinary, keeping the API secret server-side) and returns its public URL
 * — WGL's /send-media endpoint needs a publicly reachable URL, not a file
 * upload, so the image must be hosted somewhere before sending.
 */
export async function uploadCampaignImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 5MB).');
  }

  const form = new FormData();
  form.append('file', file);

  const { url } = await apiFetch<{ url: string }>('/campaigns/upload-image', {
    method: 'POST',
    body: form,
  });
  return url;
}
