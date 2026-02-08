'use client'

import { useState, useRef } from 'react'
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
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

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

    return (
        <div className="min-h-screen bg-dark-950">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-3xl font-display font-bold text-white mb-8">Account Settings</h1>

                    <div className="grid md:grid-cols-4 gap-8">
                        {/* Sidebar Tabs */}
                        <div className="md:col-span-1 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                        ? 'bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20'
                                        : 'text-dark-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            ))}
                            <hr className="border-white/5 my-4" />
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-3">
                            <div className="glass-card p-8 animate-fade-in">
                                {activeTab === 'profile' && (
                                    <div className="space-y-8">
                                        <div>
                                            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

                                            {/* Avatar Section */}
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className="relative group">
                                                    {profile?.avatar_url ? (
                                                        <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-black/40">
                                                            <Image
                                                                src={profile.avatar_url}
                                                                alt="Profile"
                                                                fill
                                                                className="object-cover"
                                                                sizes="96px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-black/40">
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
                                                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 border border-white/10 flex items-center justify-center text-white transition-colors shadow-lg"
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
                                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-dark-700 border border-white/10 flex items-center justify-center text-white transition-colors shadow-lg"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold mb-1">Profile Photo</h3>
                                                    <p className="text-sm text-dark-400 mb-2">PNG, JPG or WEBP. Max 2MB.</p>
                                                    {isUploading && (
                                                        <div className="w-48 h-2 bg-dark-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-500 transition-all duration-300"
                                                                style={{ width: `${uploadProgress}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Form */}
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-dark-300">Full Name</label>
                                                    <input
                                                        type="text"
                                                        defaultValue={profile?.full_name}
                                                        className="input-field"
                                                        placeholder="Your full name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-dark-300">Email</label>
                                                    <input
                                                        type="email"
                                                        defaultValue={user?.email}
                                                        className="input-field"
                                                        disabled
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-dark-300">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        defaultValue={profile?.phone || ''}
                                                        className="input-field"
                                                        placeholder="+1 234 567 8900"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-dark-300">College</label>
                                                    <input
                                                        type="text"
                                                        className="input-field"
                                                        placeholder="Select your college"
                                                        disabled
                                                    />
                                                </div>
                                            </div>

                                            <button className="mt-6 btn-primary flex items-center gap-2">
                                                <Save className="w-5 h-5" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                                        <p className="text-dark-400">Notification settings coming soon...</p>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-bold text-white mb-6">Privacy & Security</h2>
                                        <p className="text-dark-400">Privacy settings coming soon...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
