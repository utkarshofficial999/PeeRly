'use client'

import { useState, useRef, useEffect } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { User, Bell, Shield, LogOut, Camera, Save, Upload, X } from 'lucide-react'
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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, WEBP)')
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            console.log('📤 Uploading avatar:', filePath)

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('❌ Upload error:', uploadError)
                throw uploadError
            }

            console.log('✅ Upload successful:', uploadData)
            setUploadProgress(50)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            console.log('🔗 Public URL:', publicUrl)
            setUploadProgress(75)

            // Delete old avatar if exists
            if (profile?.avatar_url) {
                const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
                await supabase.storage.from('avatars').remove([oldPath])
                console.log('🗑️ Deleted old avatar')
            }

            // Update profile in database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id)

            if (updateError) {
                console.error('❌ Update error:', updateError)
                throw updateError
            }

            console.log('✅ Profile updated')
            setUploadProgress(100)

            // Refresh profile data
            await refreshProfile()

            alert('Profile photo updated successfully! ✅')
        } catch (error: any) {
            console.error('❌ Error uploading avatar:', error)
            alert(`Failed to upload photo: ${error.message}`)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveAvatar = async () => {
        if (!user || !profile?.avatar_url) return

        if (!confirm('Are you sure you want to remove your profile photo?')) return

        setIsUploading(true)

        try {
            // Delete from storage
            const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
            await supabase.storage.from('avatars').remove([oldPath])

            // Update profile
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
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-24 md:pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-6 md:mb-8 text-center md:text-left">Account Settings</h1>

                    <div className="flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-8">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                                        ? 'bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20'
                                        : 'text-dark-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="text-xs md:text-sm">{tab.label}</span>
                                </button>
                            ))}
                            <div className="hidden md:block">
                                <hr className="border-white/5 my-4" />
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            <div className="glass-card p-5 md:p-8 animate-fade-in">
                                {activeTab === 'profile' && (
                                    <div className="space-y-6 md:space-y-8">
                                        <div>
                                            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Profile Information</h2>

                                            {/* Avatar Section */}
                                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8 text-center md:text-left">
                                                <div className="relative group">
                                                    {profile?.avatar_url ? (
                                                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-xl shadow-black/40">
                                                            <Image
                                                                src={profile.avatar_url}
                                                                alt="Profile"
                                                                fill
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 80px, 96px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-xl shadow-black/40">
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
                                                        className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 border border-white/10 flex items-center justify-center text-white transition-colors shadow-lg"
                                                    >
                                                        {isUploading ? (
                                                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Camera className="w-4 h-4 md:w-5 md:h-5" />
                                                        )}
                                                    </button>

                                                    {profile?.avatar_url && (
                                                        <button
                                                            onClick={handleRemoveAvatar}
                                                            disabled={isUploading}
                                                            className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-dark-700 border border-white/10 flex items-center justify-center text-white transition-colors shadow-lg"
                                                        >
                                                            <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold mb-0.5 md:mb-1 text-sm md:text-base">Profile Photo</h3>
                                                    <p className="text-[11px] md:text-sm text-dark-400 mb-2">PNG, JPG or WEBP. Max 2MB.</p>
                                                    {isUploading && (
                                                        <div className="w-32 md:w-48 h-1.5 md:h-2 bg-dark-800 rounded-full overflow-hidden mx-auto md:mx-0">
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
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-xs md:text-sm font-medium text-dark-300">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                                        className="input-field text-sm py-2.5"
                                                        placeholder="Your full name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-xs md:text-sm font-medium text-dark-300">Email</label>
                                                    <input
                                                        type="email"
                                                        defaultValue={user?.email}
                                                        className="input-field opacity-60 text-sm py-2.5"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-xs md:text-sm font-medium text-dark-300">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                                        className="input-field text-sm py-2.5"
                                                        placeholder="+91 00000 00000"
                                                    />
                                                </div>
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-xs md:text-sm font-medium text-dark-300">College</label>
                                                    <select
                                                        value={formData.college_id}
                                                        onChange={(e) => setFormData(p => ({ ...p, college_id: e.target.value }))}
                                                        className="input-field cursor-pointer text-sm py-2.5"
                                                    >
                                                        <option value="">Select your college</option>
                                                        {colleges.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveChanges}
                                                disabled={isSaving}
                                                className="mt-6 w-full md:w-auto btn-primary flex items-center justify-center gap-2 py-3 md:py-2.5"
                                            >
                                                {isSaving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Save className="w-5 h-5" />
                                                )}
                                                <span className="text-sm font-bold">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center md:text-left">Notification Preferences</h2>
                                        <div className="p-12 text-center">
                                            <Bell className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                            <p className="text-dark-400 font-medium">Coming soon...</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div className="space-y-4 md:space-y-6">
                                        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 text-center md:text-left">Privacy & Security</h2>
                                        <div className="p-12 text-center">
                                            <Shield className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                            <p className="text-dark-400 font-medium">Coming soon...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sign Out on Mobile */}
                            <button
                                onClick={() => signOut()}
                                className="md:hidden w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 bg-red-500/10 transition-all font-bold text-sm"
                            >
                                <LogOut className="w-4 h-4" />
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
