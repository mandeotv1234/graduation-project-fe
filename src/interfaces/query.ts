import { UseMutationOptions } from '@tanstack/react-query';

export interface UseMutationLoginOptions extends UseMutationOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: any) => void;
}
