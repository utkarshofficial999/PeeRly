'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'

export default function SignupPage() {
    const router = useRouter()
    const { signUp, user } = useAuth()

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        agreeTerms: false,
    })

    // Proactive redirect: if we detect a session during signup (some providers auto-login)
    useEffect(() => {
        if (user && !isLoading) {
            console.log('探 SignUp: User detected, redirecting to dashboard')
            router.push('/dashboard')
            router.refresh()
        }
    }, [user, isLoading, router])

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains a number', met: /\d/.test(formData.password) },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    ]

    const isPasswordValid = passwordRequirements.every(req => req.met)
    const isCollegeEmail = formData.email.includes('.edu') || formData.email.includes('.ac.in')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!isPasswordValid) {
            setError('Please meet all password requirements')
            return
        }

        if (!formData.agreeTerms) {
            setError('Please agree to the terms and conditions')
            return
        }

        setIsLoading(true)

        try {
            const { error } = await signUp(formData.email, formData.password, formData.fullName)

            if (error) {
                // If user exists, it means signup actually worked but returned a fetch error
                if (user) return;

                if (error.message.includes('already registered')) {
                    setError('This email is already registered. Try logging in instead.')
                } else if (error.message.includes('fetch')) {
                    setError('Network connection error. Please try again.')
                } else {
                    setError(error.message)
                }
                return
            }

            // Redirect to login with success message
            router.push('/login?message=Check your email to verify your account')
        } catch (err) {
            if (!user) {
                setError('Something went wrong. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-dark-950 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="glow-orb-accent w-[500px] h-[500px] -top-48 -left-48 opacity-20" />
            <div className="glow-orb-primary w-[400px] h-[400px] bottom-0 -right-32 opacity-20" />

            <Header />

            <main className="pt-32 pb-16 px-4">
                <div className="max-w-md mx-auto">
                    {/* Card */}
                    <div className="glass-card p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-display font-bold text-white mb-2">
                                Create Account
                            </h1>
                            <p className="text-dark-400">
                                Join your campus marketplace
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-dark-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        placeholder="Enter your full name"
                                        required
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="you@college.edu or you@college.ac.in"
                                        required
                                        className="input-field pl-12"
                                    />
                                </div>
                                {formData.email && (
                                    <p className={`mt-2 text-xs flex items-center gap-1 ${isCollegeEmail ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {isCollegeEmail ? (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Valid college email
                                            </>
                                        ) : (
                                            <>Use your college email for verification badge</>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Create a strong password"
                                        required
                                        className="input-field pl-12 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {formData.password && (
                                    <div className="mt-3 space-y-1.5">
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className={`flex items-center gap-2 text-xs ${req.met ? 'text-emerald-400' : 'text-dark-500'}`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500/20' : 'bg-dark-700'}`}>
                                                    {req.met && <Check className="w-3 h-3" />}
                                                </div>
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.agreeTerms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                                    className="w-5 h-5 mt-0.5 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                />
                                <span className="text-sm text-dark-400">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
                                </span>
                            </label>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full justify-center py-3.5"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-dark-900 px-4 text-sm text-dark-500">or</span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <p className="text-center text-dark-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
