import { useContext } from 'preact/hooks';

export const API = 'http://localhost:3000/api';

export function useAuth(userEmail) {
  const getAuthHeader = () => {
    return { 'Authorization': 'Bearer ' + btoa(userEmail) };
  };

  return { getAuthHeader };
}

const BASE = '';

async function req(path, opts = {}, adminToken = null) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (adminToken) headers['x-admin-token'] = adminToken;

  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Upload endpoints ─────────────────────────────────────────────────────────

export function initUpload(payload) {
  return req('/api/upload/init', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeUpload(payload) {
  return req('/api/upload/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function uploadToS3(presignedUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(xhr.getResponseHeader('ETag'));
      else reject(new Error(`S3 error: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Błąd sieci'));
    xhr.send(file);
  });
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export function fetchUploads(token, page = 1, limit = 50) {
  return req(`/api/admin/uploads?page=${page}&limit=${limit}`, {}, token);
}

export function fetchDownloadUrl(token, uploadId, fileId) {
  return req(`/api/admin/uploads/${uploadId}/download/${fileId}`, {}, token);
}

export function deleteUpload(token, uploadId) {
  return req(`/api/admin/uploads/${uploadId}`, { method: 'DELETE' }, token);
}