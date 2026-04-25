import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('scalekit_user');
    
    if (!userCookie?.value) {
      return null;
    }
    
    return JSON.parse(userCookie.value);
  } catch {
    return null;
  }
}