
import type { User } from '../types';

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'Example Admin',
  email: 'admin@example.com',
  avatarUrl: 'https://picsum.photos/100',
};

export const login = (username: string, pass: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === 'admin' && pass === 'admin') {
        resolve(mockUser);
      } else {
        reject(new Error('Invalid username or password'));
      }
    }, 500);
  });
};

export const logout = (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
};
