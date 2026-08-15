export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  token?: string;
  /** Token lifetime in seconds. */
  expiresIn?: number;
}
