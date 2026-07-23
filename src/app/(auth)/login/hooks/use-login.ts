/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect, useCallback, useRef } from 'react'

import { login, loginWithGoogle, loginWithMicrosoft } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { GoogleCodeResponse, LoginFormValues, loginSchema } from '@/lib/types'
import { PATH, ROLES } from '@/lib/constants'
import { decodeJwtPayload } from '@/lib/utils'
import { useGoogleLogin } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '@/lib/msal-config'
import {
  consumeSafeReturnUrl,
  rememberRequestedReturnUrl
} from '@/lib/utils/auth-redirect'

export function useLogin() {
  const { callApi, isLoading } = useApi()
  const router = useRouter()
  const [showOAuthPopup, setShowOAuthPopup] = useState<
    'google' | 'microsoft' | null
  >(null)
  const [emailValue, setEmailValue] = useState('')

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

  const handleLoginSuccess = useCallback(
    (accessToken: string) => {
      const decoded = decodeJwtPayload(accessToken)
      const role = decoded?.role
      const returnUrl = consumeSafeReturnUrl(role)
      if (returnUrl) {
        router.replace(returnUrl)
        return
      }
      switch (role) {
        case ROLES.STUDENT:
          router.replace(PATH.STUDENT_EXAMS)
          break
        case ROLES.TEACHER:
          router.replace(PATH.TEACHER_CLASSES)
          break
        case ROLES.ADMIN:
          router.replace(PATH.ADMIN_FEEDBACKS)
          break
        default:
          router.replace(PATH.HOME)
      }
    },
    [router]
  )

  const { instance } = useMsal()

  // Handle Microsoft redirect response on page load (run once only)
  const hasProcessedRedirect = useRef(false)
  useEffect(() => {
    if (hasProcessedRedirect.current) return
    hasProcessedRedirect.current = true

    instance
      .handleRedirectPromise()
      .then(async (result) => {
        if (result?.idToken) {
          console.log('Microsoft redirect response received')
          const response = await callApi(
            loginWithMicrosoft({ idToken: result.idToken })
          )
          if (response.data) {
            handleLoginSuccess(response.data.accessToken)
          }
        }
      })
      .catch((error) => {
        console.error('Microsoft redirect failed:', error)
      })
  }, [])

  const redirectUri =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000'
  const onGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const code = (codeResponse as GoogleCodeResponse)?.code
      try {
        if (!code) return

        const response = await callApi(
          loginWithGoogle({
            code,
            redirectUri,
            rememberMe: true
          })
        )

        if (response.data) {
          handleLoginSuccess(response.data.accessToken)
        }
      } catch (error) {
        console.error('Google login failed:', error)
      }
    },
    flow: 'auth-code',
    ux_mode: 'popup'
  })

  // Use redirect flow instead of popup - much more reliable
  const onMicrosoftLogin = () => {
    rememberRequestedReturnUrl()
    instance.loginRedirect(loginRequest)
  }

  const onSubmit = async (data: LoginFormValues) => {
    // Regular login with email/password
    const response = await callApi(login(data))
    if (response.data) handleLoginSuccess(response.data.accessToken)
  }

  return {
    register,
    formState: { errors },
    handleSubmit,
    isLoading,
    onSubmit,
    showOAuthPopup,
    setShowOAuthPopup,
    emailValue,
    onGoogleLogin,
    onMicrosoftLogin
  }
}
