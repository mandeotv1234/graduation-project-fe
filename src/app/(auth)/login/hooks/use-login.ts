import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { loginAction } from '@/lib/actions'
import { LoginFormValues, loginSchema } from '@/lib/types'

export function useLogin() {
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await loginAction(data)
      if (!response.success) {
        setErrorMessage(response.message)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Đã xảy ra lỗi, vui lòng thử lại.')
    }
    setIsSubmitting(false)
  }

  return {
    register,
    handleSubmit,
    errors,
    errorMessage,
    isSubmitting,
    onSubmit
  }
}
