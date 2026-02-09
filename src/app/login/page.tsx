'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import Logo from '@/components/ui/Logo'

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn, signInWithGoogle, user, isLoading: authLoading } = useAuth()

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const redirectTo = searchParams?.get('redirectTo') || '/dashboard'

    // Proactive redirect: if AuthContext reveals we are logged in, just go.
    useEffect(() => {
        if (user && !authLoading && !isLoading) {
            console.log('Login: User detected, redirecting to', redirectTo)
            router.push(redirectTo)
            router.refresh()
        }
    }, [user, authLoading, isLoading, redirectTo, router])

    const handleGoogleSignIn = async () => {
        setError('')
        setIsLoading(true)
        try {
            const { error: signInError } = await signInWithGoogle()
            if (signInError) throw signInError
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google')
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const { error: signInError } = await signIn(formData.email, formData.password)

            if (signInError) {
                if (signInError.message.includes('Invalid login')) {
                    setError('Invalid email or password')
                } else if (signInError.message.includes('Email not confirmed')) {
                    setError('Please verify your email before logging in')
                } else if (signInError.message.includes('fetch')) {
                    setError('Network connection error. Please try again.')
                } else {
                    setError(signInError.message)
                }
                return
            }

            // Normal successful redirect handled by useEffect or here
            router.push(redirectTo)
            router.refresh()
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 relative overflow-hidden">
            <Header />

            <main className="pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-md mx-auto">
                    <div className="premium-card p-8 relative z-10">
                        <div className="flex justify-center mb-6">
                            <Logo className="scale-110" />
                        </div>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-surface-900 mb-2">
                                Welcome Back
                            </h1>
                            <p className="text-surface-700 font-bold">
                                Log in to your PeeRly account
                            </p>
                        </div>

                        {searchParams?.get('message') && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-sm font-bold">
                                {searchParams.get('message')}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-black text-surface-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="you@college.edu"
                                        required
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-black text-surface-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Enter your password"
                                        required
                                        className="input-field pl-12 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full justify-center py-3.5"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Log In
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-surface-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-xs font-black uppercase tracking-widest text-surface-400">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-surface-200 text-surface-700 font-black py-3.5 px-4 rounded-2xl hover:bg-surface-50 hover:border-surface-300 transition-all active:scale-95 mb-6 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <p className="text-center text-surface-600 font-bold">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-black transition-colors underline underline-offset-4 decoration-primary-200 hover:decoration-primary-500">
                                Sign up free
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-surface-50 flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-surface-400 font-bold tracking-widest uppercase text-xs">Preparing Access...</p>
                    </div>
                </main>
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
