'use client'

import { createBrowserClient } from '@supabase/ssr'

// Singleton client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates a Supabase client for use in client components.
 */
export function createClient() {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Special handling for browser singleton
    const isBrowser = typeof window !== 'undefined'
    if (isBrowser && supabaseClient) return supabaseClient

    // Validate environment variables (warn instead of throw during build if possible)
    if (!supabaseUrl || !supabaseAnonKey) {
        if (isBrowser) {
            console.error('[Supabase] Missing environment variables')
            throw new Error('Supabase environment variables are missing')
        }
        // Return a mock client during build to prevent crashes
        return {} as any
    }

    // Create client with hardened production settings
    const client = createBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
            },
            global: {
                headers: { 'x-client-info': 'peerly-web' },
            }
        }
    )

    if (isBrowser) {
        supabaseClient = client
        console.log('🚀 [Supabase] Client initialized in browser');
    }

    return client
}
