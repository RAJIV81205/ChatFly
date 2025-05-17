"use client"

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Lock, 
  Mail, 
  LogIn, 
  User, 
  KeyRound, 
  Fingerprint,
  Eye, 
  EyeOff,
  ArrowRight,
  Shield 
} from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    // Add your login logic here
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-[#16213e]">
      <div className="w-full max-w-md p-8 space-y-8 bg-black/60 backdrop-blur-lg rounded-2xl border border-[#312244]/30 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-r from-[#312244] to-[#0f3460] p-2 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-[#e2e2e2]" />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Sign in to your account to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#312244]/50 rounded-xl bg-black/40 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#312244] focus:border-transparent"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-[#312244]/50 rounded-xl bg-black/40 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#312244] focus:border-transparent"
                  placeholder="Password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#312244] focus:ring-[#312244] border-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-[#a78bfa] hover:text-[#c4b5fd] transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/40 p-3 rounded-lg border border-red-500/50">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-white bg-gradient-to-r from-[#312244] to-[#0f3460] hover:from-[#3a2a52] hover:to-[#16446e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#312244] font-medium"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <LogIn className="h-5 w-5 text-[#c4b5fd] group-hover:text-[#ddd6fe]" />
                )}
              </span>
              {loading ? "Authenticating..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#312244]/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/20 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-[#312244]/30 rounded-lg bg-black/40 text-gray-400 hover:bg-black/50 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.0003 2C6.47727 2 2.00034 6.47693 2.00034 12C2.00034 16.9913 5.65794 21.1283 10.4373 21.8785V14.8906H7.89839V12H10.4373V9.79688C10.4373 7.29063 11.9305 5.90625 14.2153 5.90625C15.3089 5.90625 16.4533 6.10156 16.4533 6.10156V8.5625H15.1924C13.9503 8.5625 13.5633 9.33334 13.5633 10.1242V12H16.3363L15.8931 14.8906H13.5633V21.8785C18.3427 21.1283 22.0003 16.9913 22.0003 12C22.0003 6.47693 17.5233 2 12.0003 2Z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg bg-black/20 text-gray-300 hover:bg-black/30"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.8,10.5h-10v3h5.9c-0.5,2.3-2.5,4-4.9,4c-2.8,0-5-2.2-5-5s2.2-5,5-5c1.2,0,2.3,0.4,3.2,1.2l2.4-2.4 c-1.5-1.4-3.5-2.2-5.6-2.2c-4.4,0-8,3.6-8,8s3.6,8,8,8c4.6,0,7.7-3.2,7.7-7.7C20.5,12.8,20.7,11.6,21.8,10.5z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-white/10 rounded-lg bg-black/20 text-gray-300 hover:bg-black/30"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.365 1.43c0 1.143-.925 2.066-2.064 2.066-1.142 0-2.067-.923-2.067-2.066C12.234.286 13.16 0 14.3 0c1.14 0 2.064.286 2.064 1.43zM4.502 7.5H1.005V24h3.497V7.5zm.65 0h3.35v1.077c1.215-1.71 2.72-1.43 4.787-1.43 3.164 0 5.713 1.43 5.713 6.11V24h-3.496v-9.667c0-2.143 0-4.93-3-4.93-2.14 0-2.853 1.29-2.853 3.437V24H6.151V7.5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <div className="text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link href="/register" className="font-medium text-[#a78bfa] hover:text-[#c4b5fd] flex items-center justify-center mt-2 transition-colors">
              Create an account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login