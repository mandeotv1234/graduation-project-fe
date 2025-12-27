import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { login } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { LoginFormValues, loginSchema } from '@/lib/types'
import { PATH } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export function useLogin() {
  const { callApi, isLoading } = useApi()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginFormValues) => {
    const response = await callApi(login(data))

    if (response.data) {
      router.push(PATH.HOME)
    }
  }

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    onSubmit
  }
}
