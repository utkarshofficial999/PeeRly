'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    isLoading: boolean
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const supabase = useMemo(() => createClient(), [])

    // Fetch user profile from profiles table
    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }
        return data as Profile
    }, [supabase])

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (user) {
            const profileData = await fetchProfile(user.id)
            setProfile(profileData)
        }
    }, [user, fetchProfile])

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false)
            return
        }

        let mounted = true

        const initializeAuth = async () => {
            try {
                // Use getSession but be aware it might trigger internal auth locks
                const { data: { session: initialSession }, error } = await supabase.auth.getSession()

                if (error) throw error

                if (!mounted) return

                if (initialSession) {
                    setSession(initialSession)
                    setUser(initialSession.user)
                    // Fetch profile in non-blocking way
                    fetchProfile(initialSession.user.id).then(data => {
                        if (mounted && data) setProfile(data)
                    })
                }
            } catch (error: any) {
                // Ignore benign errors like AbortError or Lock errors during dev HMR
                if (error.name === 'AbortError' || error.message?.includes('Lock')) return
                console.error('Error initializing auth:', error)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: any, currentSession: Session | null) => {
                if (!mounted) return

                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    try {
                        const profileData = await fetchProfile(currentSession.user.id)
                        if (mounted) setProfile(profileData)
                    } catch (err) {
                        console.error('Auth state change profile fetch error:', err)
                    }
                } else {
                    setProfile(null)
                }

                // If it's a signed-out event or we have a profile/no-profile, we're done loading
                if (mounted) setIsLoading(false)
            }
        )

        initializeAuth()

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase, fetchProfile])

    // Sign up with email and password
    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                isLoading,
                signUp,
                signIn,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
