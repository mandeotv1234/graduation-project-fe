import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { login } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { LoginFormValues, loginSchema } from '@/lib/types'
import { PATH, ROLES } from '@/lib/constants'
import { decodeJwtPayload } from '@/lib/utils'
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
      const decoded = decodeJwtPayload(response.data.accessToken)
      const role = decoded?.role

      // Route based on role
      switch (role) {
        case ROLES.STUDENT:
          router.push(PATH.STUDENT_EXAMS)
          break
        case ROLES.TEACHER:
          router.push(PATH.TEACHER_CLASSES)
          break
        case ROLES.ADMIN:
          router.push(PATH.HOME)
          break
        default:
          router.push(PATH.HOME)
      }
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
