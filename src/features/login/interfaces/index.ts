export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginParams {
  email: string;
  password: string;
}
