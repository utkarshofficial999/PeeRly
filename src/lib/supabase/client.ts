import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    // Return existing client if already created
    if (supabaseClient) return supabaseClient

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        if (typeof window === 'undefined') {
            console.warn('Supabase environment variables are missing during build. Returning a mock client to prevent build crash.')
            // Return a mock object that prevents crashes during static generation
            return {
                auth: {
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                    getSession: async () => ({ data: { session: null }, error: null }),
                },
                from: () => ({
                    select: () => ({
                        eq: () => ({
                            eq: () => ({
                                order: () => ({
                                    limit: () => Promise.resolve({ data: [], error: null }),
                                    range: () => Promise.resolve({ data: [], error: null }),
                                    single: () => Promise.resolve({ data: null, error: null }),
                                }),
                                limit: () => Promise.resolve({ data: [], error: null }),
                            }),
                            order: () => Promise.resolve({ data: [], error: null }),
                        }),
                        order: () => Promise.resolve({ data: [], error: null }),
                    }),
                }),
            } as any
        }
        throw new Error('Missing Supabase environment variables')
    }

    // Create singleton client with optimized settings
    supabaseClient = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            }
        }
    )

    return supabaseClient
}

