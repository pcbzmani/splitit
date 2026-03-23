import { LoginForm } from '@/components/auth/LoginForm'
import { SplitSquareHorizontal } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-indigo-600 p-3">
            <SplitSquareHorizontal className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SplitIt</h1>
          <p className="text-center text-sm text-muted-foreground">
            Smart expense splitting with AI. Sign in to continue.
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <a href="#" className="underline hover:text-foreground">Terms</a> and{' '}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
