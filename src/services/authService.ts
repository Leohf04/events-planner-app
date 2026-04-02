import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export interface User {
  id: number;
  username: string;
  role: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    await api.setToken(response.access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    await api.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    return api.isAuthenticated();
  }
}

export default new AuthService();
