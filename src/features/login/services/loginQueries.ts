import { AxiosResponse } from 'axios';
import { ILoginParams, ILoginResponse } from '../interfaces';
import axiosClient from '@/services/api/apiClient';
import { API_PATH } from '@/constants/apis.constant';

export function loginUser(
  params: ILoginParams,
): Promise<AxiosResponse<ILoginResponse>> {
  return axiosClient.post<ILoginResponse>(
    API_PATH.AUTHENTICATE.LOGIN.API_PATH,
    params,
  );
}
