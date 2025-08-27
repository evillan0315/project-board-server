export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'SUPERADMIN';
  username?: string;
  provider?: 'google' | 'github' | 'local' | 'unknown';
}
