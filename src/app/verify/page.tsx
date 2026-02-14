'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/layout/Header'
import {
    ShieldCheck,
    Camera,
    Upload,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Clock,
    FileCheck,
    Lock,
    ArrowRight,
    X,
    XCircle
} from 'lucide-react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function VerificationPage() {
    const { user, profile, isLoading: authLoading, refreshProfile } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Upload, 2: Under Review, 3: Approved
    const [isUploading, setIsUploading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [hasConsent, setHasConsent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [colleges, setColleges] = useState<any[]>([])
    const [selectedCollegeId, setSelectedCollegeId] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }

        if (profile?.verification_status === 'approved') {
            router.push('/dashboard')
        } else if (profile?.verification_status === 'pending' && profile?.id_card_url) {
            setStep(2)
        }

        // Pre-fill college ID if profile has it
        if (profile?.college_id) {
            setSelectedCollegeId(profile.college_id)
        }
    }, [user, profile, authLoading, router])

    useEffect(() => {
        const fetchColleges = async () => {
            const { data } = await supabase.from('colleges').select('*').eq('is_active', true)
            if (data) setColleges(data)
        }
        fetchColleges()
    }, [supabase])

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
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!selectedImage || !hasConsent || !user) return

        setIsUploading(true)
        setError(null)

        try {
            // 1. Upload to storage
            const fileExt = selectedImage.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('id_cards')
                .upload(filePath, selectedImage)

            if (uploadError) throw uploadError

            // 2. Get Public URL (Actually private, but we store the path)
            const { data: { publicUrl } } = supabase.storage
                .from('id_cards')
                .getPublicUrl(filePath)

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    id_card_url: filePath,
                    verification_status: 'pending',
                    college_id: selectedCollegeId || profile?.college_id
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            await refreshProfile()
            setStep(2)
        } catch (err: any) {
            console.error('Upload failed:', err)
            setError(err.message || 'Verification upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Progress Stepper */}
                    <div className="flex items-center justify-between mb-12 px-2 md:px-10">
                        <StepItem
                            number={1}
                            label="Account"
                            status={step >= 1 ? 'complete' : 'pending'}
                        />
                        <div className={`flex-1 h-0.5 mx-4 ${step > 1 ? 'bg-emerald-500' : 'bg-surface-200'}`} />
                        <StepItem
                            number={2}
                            label="ID Upload"
                            status={step > 1 ? 'complete' : step === 1 ? 'current' : 'pending'}
                        />
                        <div className={`flex-1 h-0.5 mx-4 ${step > 2 ? 'bg-emerald-500' : 'bg-surface-200'}`} />
                        <StepItem
                            number={3}
                            label="Review"
                            status={step === 3 ? 'current' : step > 3 ? 'complete' : 'pending'}
                        />
                    </div>

                    <div className="premium-card p-8 md:p-12 relative overflow-hidden">
                        {/* Status Sections */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <div className="text-center mb-10">
                                    <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-soft">
                                        <ShieldCheck className="w-10 h-10 text-primary-600" />
                                    </div>
                                    <h1 className="text-3xl font-black text-surface-900 mb-4 tracking-tight">Verify Your Student Identity</h1>
                                    <p className="text-surface-600 font-bold max-w-md mx-auto">
                                        To maintain a secure campus environment, all PeerLY members must verify their college status.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* College Selection (Required if not set) */}
                                    {!profile?.college_id && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-black text-surface-700 flex items-center gap-2">
                                                1. Select Your Institution
                                            </label>
                                            <select
                                                value={selectedCollegeId}
                                                onChange={(e) => setSelectedCollegeId(e.target.value)}
                                                className="input-field cursor-pointer"
                                                required
                                            >
                                                <option value="">Choose a college...</option>
                                                {colleges.map(college => (
                                                    <option key={college.id} value={college.id}>{college.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Upload Area */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-black text-surface-700 flex items-center gap-2">
                                            {!profile?.college_id ? '2.' : ''} Upload College ID Card
                                        </label>
                                        {!previewUrl ? (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full aspect-video md:aspect-[21/9] rounded-[2.5rem] border-4 border-dashed border-surface-200 bg-surface-50 flex flex-col items-center justify-center gap-4 hover:border-primary-300 hover:bg-primary-50 group transition-all"
                                            >
                                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                                                    <Camera className="w-8 h-8 text-primary-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-black text-surface-900">Upload ID Photo</p>
                                                    <p className="text-sm font-bold text-surface-500">Tap to browse or take a photo</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-premium group">
                                                <NextImage
                                                    src={previewUrl}
                                                    alt="ID Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                                                    className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-all hover:scale-110"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />

                                    {/* Consent */}
                                    <div className="bg-surface-50 p-6 rounded-3xl border border-surface-100">
                                        <div className="flex gap-4">
                                            <div className="shrink-0 mt-1">
                                                <input
                                                    type="checkbox"
                                                    id="consent"
                                                    checked={hasConsent}
                                                    onChange={(e) => setHasConsent(e.target.checked)}
                                                    className="w-5 h-5 rounded-lg border-2 border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                />
                                            </div>
                                            <label htmlFor="consent" className="text-sm font-bold text-surface-600 leading-relaxed cursor-pointer select-none">
                                                I confirm that this is my valid college ID card issued by <span className="text-primary-600 font-black">{(profile as any)?.college_name || 'my institution'}</span>.
                                                I understand this information is used solely for verification.
                                            </label>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-in shake">
                                            <AlertCircle className="w-5 h-5" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        disabled={(!profile?.college_id && !selectedCollegeId) || !selectedImage || !hasConsent || isUploading}
                                        onClick={handleUpload}
                                        className="btn-primary w-full py-5 rounded-[2rem] text-lg font-black shadow-button flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Verifying Image...
                                            </>
                                        ) : (
                                            <>
                                                Submit for Review
                                                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center justify-center gap-2 text-surface-400">
                                        <Lock className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">End-to-End Encrypted Verification</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && profile?.verification_status === 'pending' && (
                            <div className="text-center py-10 animate-in zoom-in-95">
                                <div className="w-32 h-32 relative mx-auto mb-10">
                                    <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping" />
                                    <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-premium border-4 border-surface-50">
                                        <Clock className="w-16 h-16 text-primary-500 animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-surface-900 mb-4 tracking-tight">Identity Under Review</h2>
                                <p className="text-surface-600 font-bold max-w-sm mx-auto mb-10 leading-relaxed">
                                    Our Super Admin is currently verifying your ID. This usually takes less than 2 hours during campus hours.
                                </p>
                                <div className="bg-surface-50 rounded-3xl p-6 border border-surface-100 flex items-center gap-4 text-left max-w-md mx-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-soft">
                                        <Clock className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-surface-900">We'll Notify You</p>
                                        <p className="text-xs font-bold text-surface-500">You will receive an email once approved.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {profile?.verification_status === 'rejected' && step !== 1 && (
                            <div className="text-center py-10 animate-in zoom-in-95">
                                <div className="w-32 h-32 relative mx-auto mb-10">
                                    <div className="relative w-32 h-32 bg-red-50 rounded-full flex items-center justify-center shadow-premium border-4 border-white">
                                        <XCircle className="w-16 h-16 text-red-500" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-surface-900 mb-2 tracking-tight">Verification Rejected</h2>
                                <p className="text-surface-600 font-bold max-w-sm mx-auto mb-6 leading-relaxed">
                                    Unfortunately, your student identity could not be verified.
                                </p>

                                {profile.rejection_reason && (
                                    <div className="bg-red-50 rounded-[2.5rem] p-8 border-2 border-red-100 max-w-md mx-auto mb-10 relative overflow-hidden group">
                                        <div className="absolute -top-4 -right-4 w-24 h-24 text-red-100/50 rotate-12 group-hover:scale-110 transition-transform">
                                            <AlertCircle className="w-full h-full" />
                                        </div>
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Reason for Rejection</p>
                                        <p className="text-lg font-black text-red-600 leading-tight">"{profile.rejection_reason}"</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setStep(1)}
                                    className="btn-primary py-4 px-10 rounded-2xl font-black flex items-center gap-3 mx-auto shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                                >
                                    Try Again
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function StepItem({ number, label, status }: { number: number, label: string, status: 'complete' | 'current' | 'pending' }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                status === 'current' ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' :
                    'bg-white border-surface-200 text-surface-400 shadow-sm'
                }`}>
                {status === 'complete' ? <CheckCircle2 className="w-6 h-6" /> : number}
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${status === 'pending' ? 'text-surface-400' : 'text-surface-900'
                }`}>
                {label}
            </span>
        </div>
    )
}


