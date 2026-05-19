export interface AuthRequest {
  googleToken: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerifyRequest {
  token: string; // 6-digit TOTP code
}

export interface JWTPayload {
  id: string;
  email: string;
  is_admin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    nome: string;
    photoUrl?: string;
    is_admin: boolean;
    totpEnabled: boolean;
  };
}

export interface DashboardData {
  rendas: any[];
  gastos_fixos: any[];
  dividas: any[];
  gastos_variaveis: any[];
  investimentos: any[];
  totals: {
    renda_liquida: number;
    gastos_fixos: number;
    dividas: number;
    investimentos: number;
    saldo_final: number;
  };
}
