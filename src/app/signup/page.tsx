'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Check, AlertCircle, Camera, X, Loader2 } from 'lucide-react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import Logo from '@/components/ui/Logo'

export default function SignupPage() {
    const router = useRouter()
    const { signUp, signInWithGoogle, user, isLoading: authLoading } = useAuth()

    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        agreeTerms: false,
    })
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const supabase = createClient()

    // Proactive redirect: if we detect a session during signup (some providers auto-login)
    useEffect(() => {
        if (user && !authLoading && !isLoading) {
            console.log('SignUp: User detected, redirecting to dashboard')
            router.push('/dashboard')
            router.refresh()
        }
    }, [user, authLoading, isLoading, router])

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains a number', met: /\d/.test(formData.password) },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    ]

    const isPasswordValid = passwordRequirements.every(req => req.met)
    const isCollegeEmail = formData.email.includes('.edu') || formData.email.includes('.ac.in')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size too large. Please upload an image smaller than 5MB.')
                return
            }
            setSelectedImage(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setError('')
        }
    }

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

        if (!isPasswordValid) {
            setError('Please meet all password requirements')
            return
        }

        if (!selectedImage) {
            setError('Please upload your college ID card for verification')
            return
        }

        if (!formData.agreeTerms) {
            setError('Please agree to the terms and conditions')
            return
        }

        setIsLoading(true)

        try {
            const { data, error } = await signUp(formData.email, formData.password, formData.fullName)

            if (error) {
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

            // If we have a user (either from data or context), upload the ID card
            const newUser = data?.user || user
            if (newUser && selectedImage) {
                const fileExt = selectedImage.name.split('.').pop()
                const fileName = `${newUser.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('id_cards')
                    .upload(fileName, selectedImage)

                if (!uploadError) {
                    await supabase
                        .from('profiles')
                        .update({
                            id_card_url: fileName,
                            verification_status: 'pending'
                        })
                        .eq('id', newUser.id)
                }
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
        <div className="min-h-screen bg-surface-50 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="glow-orb-accent w-[500px] h-[500px] -top-48 -left-48 opacity-20" />
            <div className="glow-orb-primary w-[400px] h-[400px] bottom-0 -right-32 opacity-20" />

            <Header />

            <main className="pt-20 md:pt-24 pb-16 px-4">
                <div className="max-w-md mx-auto">
                    {/* Card */}
                    <div className="premium-card p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-surface-900 mb-2">
                                Create Account
                            </h1>
                            <p className="text-surface-700 font-bold">
                                Join your campus marketplace
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-black text-surface-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
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
                                        placeholder="you@college.edu or you@college.ac.in"
                                        required
                                        className="input-field pl-12"
                                    />
                                </div>
                                {formData.email && (
                                    <p className={`mt-2 text-xs flex items-center gap-1 font-bold ${isCollegeEmail ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                                        placeholder="Create a strong password"
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

                                {/* Password Requirements */}
                                {formData.password && (
                                    <div className="mt-3 space-y-1.5">
                                        {passwordRequirements.map((req, index) => (
                                            <div key={index} className={`flex items-center gap-2 text-xs font-bold ${req.met ? 'text-emerald-600' : 'text-surface-400'}`}>
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-50' : 'bg-surface-100'}`}>
                                                    {req.met && <Check className="w-3 h-3" />}
                                                </div>
                                                {req.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ID Card Upload */}
                            <div className="space-y-4">
                                <label className="block text-sm font-black text-surface-700">
                                    College ID Card (Required)
                                </label>
                                {!previewUrl ? (
                                    <div
                                        onClick={() => document.getElementById('id-upload')?.click()}
                                        className="w-full h-40 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 flex flex-col items-center justify-center gap-2 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group"
                                    >
                                        <Camera className="w-8 h-8 text-surface-400 group-hover:text-primary-500 transition-colors" />
                                        <p className="text-xs font-black text-surface-500 group-hover:text-primary-600 transition-colors uppercase tracking-widest">Tap to upload ID photo</p>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-white shadow-soft group">
                                        <NextImage
                                            src={previewUrl}
                                            alt="ID Preview"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    id="id-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.agreeTerms}
                                    onChange={(e) => setFormData(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                                    className="w-5 h-5 mt-0.5 text-primary-600 bg-surface-50 border-surface-200 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                />
                                <span className="text-sm text-surface-600 font-bold">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary-600 hover:underline font-black">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link href="/privacy" className="text-primary-600 hover:underline font-black">Privacy Policy</Link>
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
                                <div className="w-full border-t border-surface-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-xs font-black uppercase tracking-widest text-surface-400">or</span>
                            </div>
                        </div>

                        {/* Google Sign In */}
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

                        {/* Login Link */}
                        <p className="text-center text-surface-700 font-bold">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-black transition-colors underline underline-offset-4 decoration-primary-200 hover:decoration-primary-500">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
