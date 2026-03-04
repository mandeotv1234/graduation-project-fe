import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { signUp } from '@/lib/actions'
import { RegisterFormValues, registerSchema } from '@/lib/types'
import { useApi } from '@/hooks/use-api'
import { PATH } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export function useRegister() {
  const { callApi, isLoading } = useApi()
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (data: RegisterFormValues) => {
    const result = await callApi(
      signUp({
        fullName: data.fullName,
        email: data.email,
        password: data.password
      })
    )
    if (result.data) {
      router.push(PATH.LOGIN)
    }
  }

  return {
    register,
    handleSubmit,
    isLoading,
    errors,
    onSubmit
  }
}
