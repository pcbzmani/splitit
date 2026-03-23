import { OTPForm } from '@/components/auth/OTPForm'
import { SplitSquareHorizontal } from 'lucide-react'

export default function VerifyOTPPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="rounded-2xl bg-indigo-600 p-3">
            <SplitSquareHorizontal className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
          <p className="text-center text-sm text-muted-foreground">
            We sent a 6-digit code. Enter it below to sign in.
          </p>
        </div>
        <OTPForm />
      </div>
    </div>
  )
}
