'use client'

import { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { User, Bell, Shield, LogOut, Camera, Save, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function SettingsPage() {
    const { profile, user, signOut, refreshProfile } = useAuth()
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile')
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [colleges, setColleges] = useState<any[]>([])
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        college_id: profile?.college_id || ''
    })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Fetch colleges
    useEffect(() => {
        const fetchColleges = async () => {
            const { data } = await supabase.from('colleges').select('*').eq('is_active', true)
            if (data) setColleges(data)
        }
        fetchColleges()
    }, [supabase])

    // Update formData when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                college_id: profile.college_id || ''
            })
        }
    }, [profile])

    const tabs = [
        { id: 'profile', label: 'Profile Settings', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    ]

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, WEBP)')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            setUploadProgress(50)

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setUploadProgress(75)

            if (profile?.avatar_url) {
                const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
                await supabase.storage.from('avatars').remove([oldPath])
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setUploadProgress(100)
            await refreshProfile()
            alert('Profile photo updated successfully! ✅')
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error)
            alert(`Failed to upload photo: ${error.message}`)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveAvatar = async () => {
        if (!user || !profile?.avatar_url) return
        if (!confirm('Are you sure you want to remove your profile photo?')) return

        setIsUploading(true)
        try {
            const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
            await supabase.storage.from('avatars').remove([oldPath])

            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', user.id)

            if (error) throw error
            await refreshProfile()
            alert('Profile photo removed successfully!')
        } catch (error: any) {
            console.error('Error removing avatar:', error)
            alert(`Failed to remove photo: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSaveChanges = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    college_id: formData.college_id || null
                })
                .eq('id', user.id)

            if (error) throw error
            await refreshProfile()
            alert('Profile updated successfully! ✨')
        } catch (err: any) {
            console.error('Update error:', err)
            alert(`Failed to save changes: ${err.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-50 text-surface-900">
            <Header />

            <main className="pt-24 md:pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-surface-900 mb-6 md:mb-8 text-center md:text-left">Account Settings</h1>

                    <div className="flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-8">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1 border-r border-surface-100 pr-0 md:pr-8">
                            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                                            ? 'bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20'
                                            : 'text-surface-600 hover:text-primary-600 hover:bg-primary-50'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                                        <span className="text-xs md:text-sm font-bold">{tab.label}</span>
                                    </button>
                                ))}
                                <div className="hidden md:block">
                                    <hr className="border-surface-100 my-4" />
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-sm uppercase tracking-wider"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            <div className="bg-white border border-surface-200 rounded-3xl p-5 md:p-8 shadow-soft">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6 md:space-y-8">
                                        <div>
                                            <h2 className="text-lg md:text-xl font-black text-surface-900 mb-4 md:mb-6 uppercase tracking-tight">Profile Information</h2>

                                            {/* Avatar Section */}
                                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8 text-center md:text-left">
                                                <div className="relative group">
                                                    {profile?.avatar_url ? (
                                                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-xl ring-4 ring-surface-50">
                                                            <Image
                                                                src={profile.avatar_url}
                                                                alt="Profile"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 96px, 128px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-primary flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-xl shadow-primary-500/20">
                                                            {profile?.full_name?.[0].toUpperCase() || 'U'}
                                                        </div>
                                                    )}

                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />

                                                    <button
                                                        onClick={handleAvatarClick}
                                                        disabled={isUploading}
                                                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 border-2 border-white flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                                                    >
                                                        {isUploading ? (
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Camera className="w-5 h-5" />
                                                        )}
                                                    </button>

                                                    {profile?.avatar_url && (
                                                        <button
                                                            onClick={handleRemoveAvatar}
                                                            disabled={isUploading}
                                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-surface-200 border-2 border-white flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="md:pt-4">
                                                    <h3 className="text-surface-900 font-black mb-1 text-base md:text-lg uppercase tracking-tight">Identity Photo</h3>
                                                    <p className="text-xs md:text-sm font-bold text-surface-500 mb-2">PNG, JPG or WEBP. Max size 2MB.</p>
                                                    {isUploading && (
                                                        <div className="w-32 md:w-48 h-2 bg-surface-100 rounded-full overflow-hidden mx-auto md:mx-0">
                                                            <div
                                                                className="h-full bg-primary-500 transition-all duration-300"
                                                                style={{ width: `${uploadProgress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Form */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Full Identity Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                                        className="w-full px-5 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                                        placeholder="Your official designation"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Platform Email</label>
                                                    <input
                                                        type="email"
                                                        defaultValue={user?.email}
                                                        className="w-full px-5 py-3.5 bg-surface-100 border border-surface-200 rounded-2xl text-surface-400 font-bold cursor-not-allowed"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Contact Coordinate</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                                        className="w-full px-5 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                                        placeholder="+91 00000 00000"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-surface-400 uppercase tracking-widest pl-1">Campus Association</label>
                                                    <select
                                                        value={formData.college_id}
                                                        onChange={(e) => setFormData(p => ({ ...p, college_id: e.target.value }))}
                                                        className="w-full px-5 py-3.5 bg-surface-50 border border-surface-200 rounded-2xl text-surface-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none cursor-pointer"
                                                    >
                                                        <option value="">Select your institution</option>
                                                        {colleges.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveChanges}
                                                disabled={isSaving}
                                                className="mt-8 w-full md:w-auto px-8 py-4 bg-primary-500 text-white font-black rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                            >
                                                {isSaving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Save className="w-5 h-5" />
                                                )}
                                                {isSaving ? 'Processing...' : 'Save Profile'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="w-20 h-20 bg-surface-50 rounded-3xl flex items-center justify-center mx-auto">
                                            <Bell className="w-10 h-10 text-surface-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-surface-900 uppercase tracking-tight">Notification Terminal</h2>
                                            <p className="text-surface-500 font-bold mt-1">This communication module is currently being optimized.</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="w-20 h-20 bg-surface-50 rounded-3xl flex items-center justify-center mx-auto">
                                            <Shield className="w-10 h-10 text-surface-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-surface-900 uppercase tracking-tight">Security Protocol</h2>
                                            <p className="text-surface-500 font-bold mt-1">Privacy shielding configurations are in development.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Logout */}
                            <button
                                onClick={() => signOut()}
                                className="md:hidden w-full mt-6 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl border border-red-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
