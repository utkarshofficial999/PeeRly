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
    signInWithGoogle: () => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    // Start as LOADING so we don't flash guest content while checking session
    const [isLoading, setIsLoading] = useState(true)

    const supabase = useMemo(() => createClient(), [])

    // Fetch user profile from profiles table
    const fetchProfile = useCallback(async (userId: string) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
                .abortSignal(controller.signal)

            if (error) {
                console.error('Error fetching profile:', error)
                return null
            }
            return data as Profile
        } catch (err) {
            console.error('Profile fetch aborted/failed:', err)
            return null
        } finally {
            clearTimeout(timeoutId)
        }
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
            setIsLoading(true); // Don't set false yet
            return;
        }

        let mounted = true;

        // Subscription for all changes including INITIAL_SESSION
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, currentSession: any) => {
                if (!mounted) return;

                console.log(`🔐 AuthContext: Event [${event}]`);

                const newUser = currentSession?.user ?? null;
                setSession(currentSession);
                setUser(newUser);

                // First event or session check finished - set loading to false immediately
                if (mounted && isLoading) {
                    setIsLoading(false);
                    console.log('🔐 AuthContext: Ready via onAuthStateChange');
                }

                if (newUser) {
                    fetchProfile(newUser.id).then(profileData => {
                        if (mounted) setProfile(profileData);
                    });
                } else {
                    if (mounted) setProfile(null);
                }
            }
        );

        // Immediate check to bypass event listener delay if possible
        supabase.auth.getSession().then(({ data: { session: initialSession } }: any) => {
            if (mounted && isLoading) {
                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                }
                setIsLoading(false);
                console.log('🔐 AuthContext: Ready via immediate check');
            }
        });

        // Safety timeout: If still loading after 5 seconds, force-clear it
        const safetyTimeoutId = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('🔐 AuthContext: Loading timed out. Forcing ready state.');
                setIsLoading(false);
            }
        }, 5000);

        return () => {
            mounted = false;
            clearTimeout(safetyTimeoutId);
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // Sign up with email and password
    const signUp = async (email: string, password: string, fullName: string) => {
        // No manual AbortController here to avoid internal auth locking issues
        try {
            console.log('🔐 AuthContext: Starting sign up for', email)
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

            if (error) {
                console.error('🔐 AuthContext: Sign up error:', error.message)
                throw error
            }
            console.log('🔐 AuthContext: Sign up successful')
            return { error: null }
        } catch (error: any) {
            return { error: new Error(error.message) }
        }
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            console.log('🔐 AuthContext: Starting sign in for', email)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.error('🔐 AuthContext: Sign in error:', error.message)
                throw error
            }

            console.log('🔐 AuthContext: Sign in successful');

            // Explicitly update user state in case onAuthStateChange is slow
            if (data.user) {
                setUser(data.user);
                const profileData = await fetchProfile(data.user.id);
                setProfile(profileData);
            }

            return { error: null }
        } catch (error: any) {
            return { error: new Error(error.message) }
        }
    }

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            console.log('🔐 AuthContext: Starting Google sign in')
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consensus',
                    },
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                console.error('🔐 AuthContext: Google sign in error:', error.message)
                throw error
            }

            return { error: null }
        } catch (error: any) {
            return { error: new Error(error.message) }
        }
    }

    // Sign out
    const signOut = async () => {
        try {
            console.log('🔐 AuthContext: Signing out...')
            // Try to sign out normally
            await supabase.auth.signOut()
        } catch (error) {
            console.error('🔐 AuthContext: Sign out error, forcing cleanup:', error)
        } finally {
            // Force reset state
            setUser(null)
            setProfile(null)
            setSession(null)

            if (typeof window !== 'undefined') {
                // Hard reset: nuke all cookies to be sure
                const cookies = document.cookie.split(';')
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i]
                    const eqPos = cookie.indexOf('=')
                    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
                    // Clear both standard Supabase and custom cookies
                    if (name.includes('sb-') || name.includes('peerly') || name.includes('auth')) {
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname + ';'
                    }
                }

                // Force a redirect with a 'signOut' flag to bypass middleware cache/redirects
                window.location.href = '/?signOut=true'
            }
        }
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
                signInWithGoogle,
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
