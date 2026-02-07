'use client'

import { createBrowserClient } from '@supabase/ssr'

// Singleton client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates a Supabase client for use in client components.
 * This file MUST be imported only in 'use client' components.
 */
export function createClient() {
    // Return existing client if already created
    if (supabaseClient) return supabaseClient

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Supabase] Missing environment variables:', {
            url: supabaseUrl ? '✓' : '✗',
            key: supabaseAnonKey ? '✓' : '✗'
        })
        throw new Error(
            'Supabase environment variables are missing. ' +
            'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
        )
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

    console.log('[Supabase] Client created successfully')
    return supabaseClient
}
