import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { registerAction } from '@/lib/actions'
import { RegisterFormValues, registerSchema } from '@/lib/types'

export function useRegister() {
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const result = await registerAction({
        fullName: data.fullName,
        email: data.email,
        password: data.password
      })
      if (!result.success) {
        setErrorMessage(result.message)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Đã xảy ra lỗi, vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
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
