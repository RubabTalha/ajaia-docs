import { getCurrentUserId } from './auth';

const BASE_URL = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getCurrentUserId();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Documents API
export interface DocumentListItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  type: 'owned' | 'shared';
  shared_by?: string;
  permission?: string;
}

export interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  permission: 'owner' | 'edit' | 'view';
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  owned: DocumentListItem[];
  shared: DocumentListItem[];
}

export const documentsApi = {
  list: () => request<DocumentListResponse>('/documents'),
  
  get: (id: string) => request<DocumentDetail>(`/documents/${id}`),
  
  create: (title?: string, content?: string) =>
    request<DocumentListItem>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),
  
  update: (id: string, data: { title?: string; content?: string }) =>
    request<{ id: string; title: string; updated_at: string }>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<{ success: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
    }),
};

// Sharing API
export interface ShareUser {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_avatar_color: string;
  permission: 'edit' | 'view';
  created_at: string;
}

export interface UserOption {
  id: string;
  email: string;
  name: string;
  avatar_color: string;
}

export const sharingApi = {
  getShares: (documentId: string) => request<ShareUser[]>(`/sharing/${documentId}`),
  
  share: (documentId: string, data: { userId?: string; userEmail?: string; permission?: 'edit' | 'view' }) =>
    request<ShareUser>(`/sharing/${documentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  removeShare: (documentId: string, shareId: string) =>
    request<{ success: boolean }>(`/sharing/${documentId}/${shareId}`, {
      method: 'DELETE',
    }),
  
  getUsers: () => request<UserOption[]>('/sharing/users/list'),
};

// Upload API
export interface Attachment {
  id: string;
  original_name: string;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
  url: string;
}

export interface UploadResult {
  attachment: {
    id: string;
    original_name: string;
    mime_type: string;
    size: number;
    uploaded_at: string;
  };
  imported: boolean;
}

export const uploadsApi = {
  upload: async (documentId: string, file: File, importContent = false): Promise<UploadResult> => {
    const userId = getCurrentUserId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('import', importContent.toString());

    const response = await fetch(`${BASE_URL}/uploads/${documentId}`, {
      method: 'POST',
      headers: userId ? { 'X-User-Id': userId } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  },

  list: (documentId: string) => request<Attachment[]>(`/uploads/${documentId}`),
  
  delete: (documentId: string, attachmentId: string) =>
    request<{ success: boolean }>(`/uploads/${documentId}/${attachmentId}`, {
      method: 'DELETE',
    }),
};