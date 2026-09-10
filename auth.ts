// Sistema de Autenticação Segura SkyPlan Pro
const ENV_USER = import.meta.env.VITE_AUTH_USER || 'p.costa';
const ENV_PASS_HASH = import.meta.env.VITE_AUTH_PASS_HASH || '3a8e87a71db43cc33efe8f1afcb75dcae010f1d985590cab9774264ced620046';

const AUTH_STORAGE_KEY = 'skyplan_auth_session_v1';

export interface UserSession {
  username: string;
  role: 'ADMIN' | 'USER';
  loginTime: number;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export async function loginUser(
  username: string, 
  password: string, 
  rememberMe: boolean = true
): Promise<{ success: boolean; message?: string; session?: UserSession }> {
  const trimmedUser = username.trim();
  
  if (!trimmedUser || !password) {
    return { success: false, message: 'Por favor, informe o usuário e a senha.' };
  }

  if (trimmedUser !== ENV_USER) {
    return { success: false, message: 'Usuário ou senha inválidos.' };
  }

  const inputHash = await hashPassword(password);
  if (inputHash !== ENV_PASS_HASH) {
    return { success: false, message: 'Usuário ou senha inválidos.' };
  }

  const session: UserSession = {
    username: trimmedUser,
    role: 'ADMIN',
    loginTime: Date.now(),
  };

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

  return { success: true, session };
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
