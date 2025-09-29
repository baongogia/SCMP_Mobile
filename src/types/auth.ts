export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    user: User;
  };
  message: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "member" | "instructor";
  role_front?: string[];
  tenant?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
