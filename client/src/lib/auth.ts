const USER_KEY = 'ajaia_docs_user';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  avatar_color: string;
}

// These MUST match the IDs in server/database.ts SEEDED_USER_IDS
const SEEDED_USERS: UserInfo[] = [
  { id: 'user-alex-001', email: 'alex@ajaia.com', name: 'Alex Chen', avatar_color: '#0c93e9' },
  { id: 'user-sarah-002', email: 'sarah@ajaia.com', name: 'Sarah Miller', avatar_color: '#7c3aed' },
  { id: 'user-mike-003', email: 'mike@ajaia.com', name: 'Mike Johnson', avatar_color: '#059669' },
];

export function getCurrentUser(): UserInfo | null {
  const userId = localStorage.getItem(USER_KEY);
  if (!userId) return null;
  return SEEDED_USERS.find(u => u.id === userId) || null;
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setUser(userId: string): void {
  localStorage.setItem(USER_KEY, userId);
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}

export function getSeededUsers(): UserInfo[] {
  return SEEDED_USERS;
}

export function getUserById(id: string): UserInfo | undefined {
  return SEEDED_USERS.find(u => u.id === id);
}