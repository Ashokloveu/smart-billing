export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  correlationId: string;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}
