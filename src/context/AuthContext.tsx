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
    // Start as NOT loading so pages can fetch data immediately as guest
    // If auth finishes later, the state will update automatically
    const [isLoading, setIsLoading] = useState(false)

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

        const initializeAuth = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                console.log('🔐 AuthContext: Initializing user...');
                // getUser is more reliable than getSession for SSR/Refresh scenarios
                const { data: { user: initialUser }, error } = await supabase.auth.getUser();

                if (error) {
                    // Ignore errors on initialization, let onAuthStateChange handle it
                    console.log('🔐 AuthContext: No initial user found/error');
                }

                if (!mounted) return;

                if (initialUser) {
                    setUser(initialUser);
                    // Fetch profile in background
                    fetchProfile(initialUser.id).then(profileData => {
                        if (mounted && profileData) setProfile(profileData);
                    });
                }
            } catch (error: any) {
                console.log('🔐 AuthContext: Initialization non-critical error:', error.message);
            } finally {
                clearTimeout(timeoutId);
                if (mounted) {
                    setIsLoading(false);
                    console.log('🔐 AuthContext: Ready');
                }
            }
        };

        // Subscription for subsequent changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return;

                console.log(`🔐 AuthContext: Event [${event}]`);

                const newUser = currentSession?.user ?? null;
                setSession(currentSession);
                setUser(newUser);

                if (newUser) {
                    const profileData = await fetchProfile(newUser.id);
                    if (mounted) setProfile(profileData);
                } else {
                    if (mounted) setProfile(null);
                }

                if (mounted) setIsLoading(false);
            }
        );

        // Run initialization
        initializeAuth();

        // Safety timeout: If still loading after 6 seconds, force-clear it
        const safetyTimeoutId = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('🔐 AuthContext: Loading timed out. Forcing ready state.');
                setIsLoading(false);
            }
        }, 6000);

        return () => {
            mounted = false;
            clearTimeout(safetyTimeoutId);
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

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
