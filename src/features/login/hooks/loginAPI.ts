import { API_PATH } from '@/constants/apis.constant';
import { UseMutationLoginOptions } from '@/interfaces/query';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../services/loginQueries';

export const useMutationLogin = ({
  onSuccess,
  onError,
}: UseMutationLoginOptions) => {
  return useMutation({
    mutationKey: [API_PATH.AUTHENTICATE.LOGIN.API_KEY],
    mutationFn: loginUser,
    onSuccess,
    onError,
  });
};
