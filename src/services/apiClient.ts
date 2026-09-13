/**
 * NOTIQ AI V38.0 Production REST API Client
 * Parses standardized API envelopes { status: "success", data: ... }
 * Injects JWT Authorization headers & supports multi-user workspace sync
 */

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:5000/api';
}

const API_BASE_URL = getApiBaseUrl();

function getAuthToken(): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('notiq_jwt_access_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('notiq_jwt_access_token', token);
  }
}

export function clearAuthToken() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('notiq_jwt_access_token');
  }
}

export interface ApiResponseEnvelope<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let body: any = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
        }
        throw new Error('Invalid JSON response received from server.');
      }
    }

    if (!res.ok || body.status === 'error') {
      const errMsg = body.error || body.message || `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }

    // Return inner data if formatted in API Envelope, otherwise return raw body
    return (body.data !== undefined ? body.data : body) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      console.warn(`[API Client Network Timeout] ${endpoint} timed out after ${timeoutMs}ms`);
      throw new Error(`Request timed out. Please try again.`);
    }
    console.warn(`[API Client Network Notice] ${endpoint}:`, err);
    throw err;
  }
}

export const apiClient = {
  // Authentication
  async register(fullName: string, email: string, password: string, avatar?: string) {
    return request<{ userId: string; email: string; otpCode?: string; requireVerification: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, avatar }),
    });
  },

  async verifyEmail(email: string, otpInput: string) {
    const data = await request<{ token: string; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpInput }),
    });
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async logout() {
    clearAuthToken();
    try {
      await request<{ message: string }>('/auth/logout', { method: 'POST' });
    } catch {
      // Ignored if server offline
    }
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(email: string, otpInput: string, newPassword: string) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otpInput, newPassword }),
    });
  },

  async sendOtp(email: string) {
    return request<{ message: string; email: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async deactivateAccount() {
    const data = await request<{ message: string }>('/auth/deactivate', {
      method: 'POST',
    });
    clearAuthToken();
    return data;
  },

  async deleteAccount(password: string, confirmationText: string) {
    const data = await request<{ message: string }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmationText }),
    });
    clearAuthToken();
    return data;
  },

  // Workspaces
  async getWorkspaces() {
    return request<{ workspaces: any[] }>('/workspaces');
  },

  async createWorkspace(workspaceName: string, description?: string, icon?: string) {
    return request<{ workspace: any }>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ workspaceName, description, icon }),
    });
  },

  async updateWorkspace(workspaceId: string, updates: any) {
    return request<{ workspace: any }>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteWorkspace(workspaceId: string) {
    return request<{ success: boolean }>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
  },

  // Sticky Notes
  async getStickyNotes(workspaceId?: string) {
    const query = workspaceId ? `/${encodeURIComponent(workspaceId)}` : '';
    return request<{ notes: any[] }>(`/sticky${query}`);
  },

  async createStickyNote(noteData: any) {
    return request<{ note: any }>('/sticky', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async updateStickyNote(noteId: string, updates: any) {
    return request<{ note: any }>(`/sticky/${encodeURIComponent(noteId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteStickyNote(noteId: string) {
    return request<{ success: boolean }>(`/sticky/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    });
  },

  // Flashcards
  async getFlashcards(workspaceId?: string) {
    const query = workspaceId ? `/${encodeURIComponent(workspaceId)}` : '';
    return request<{ flashcards: any[] }>(`/flashcards${query}`);
  },

  async createFlashcard(data: any) {
    return request<{ flashcard: any }>('/flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFlashcard(id: string, updates: any) {
    return request<{ flashcard: any }>(`/flashcards/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteFlashcard(id: string) {
    return request<{ success: boolean }>(`/flashcards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Quizzes
  async getQuizzes(workspaceId?: string) {
    const query = workspaceId ? `/${encodeURIComponent(workspaceId)}` : '';
    return request<{ quizzes: any[] }>(`/quizzes${query}`);
  },

  async createQuiz(data: any) {
    return request<{ quiz: any }>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateQuiz(id: string, updates: any) {
    return request<{ quiz: any }>(`/quizzes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteQuiz(id: string) {
    return request<{ success: boolean }>(`/quizzes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Vault Notes
  async getVaultNotes() {
    return request<{ vaultNotes: any[] }>('/vault');
  },

  async createVaultNote(title: string, content: string, category = 'Personal') {
    return request<{ id: string; title: string; message: string }>('/vault', {
      method: 'POST',
      body: JSON.stringify({ title, content, category }),
    });
  },

  async unlockVaultNote(vaultId: string) {
    return request<{ id: string; title: string; content: string; category: string }>('/vault/unlock', {
      method: 'POST',
      body: JSON.stringify({ vaultId }),
    });
  },

  // AI Chat History
  async getChatHistory(workspaceId?: string) {
    const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
    return request<{ history: any[] }>(`/chat/history${query}`);
  },

  async sendChatMessage(message: string, response?: string, workspaceId?: string) {
    return request<{ chatItem: any }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ userMessage: message, aiResponse: response, workspaceId }),
    });
  },

  // User Profile
  async updateUserProfile(profileData: any) {
    return request<{ message: string; user: any; profile: any }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Safe LocalStorage Migration
  async migrateLocalStorageData(payload: {
    workspaces?: any[];
    stickyNotes?: any[];
    flashcards?: any[];
    quizzes?: any[];
    vaultNotes?: any[];
    chatHistory?: any[];
  }) {
    return request<{
      status: string;
      stats: { totalProcessed: number; migratedCount: number; skippedCount: number; failedCount: number };
      workspaceMap: Record<string, string>;
    }>('/sync/migrate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};
