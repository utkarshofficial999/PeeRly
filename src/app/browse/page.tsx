import { Suspense } from 'react'
import BrowseClient from './BrowseClient'
import { createClient } from '@/lib/supabase/server'

// This is a Server Component - runs on Vercel's server, not in browser
export default async function BrowsePage({ searchParams }: { searchParams: { category?: string } }) {
    let categories: any[] = []
    let colleges: any[] = []
    let initialListings: any[] = []
    let totalCount = 0
    let serverError: string | null = null

    try {
        const supabase = createClient()

        // Fetch initial data on the server (guaranteed to run once, before page loads)
        const [categoriesResult, collegesResult, listingsResult] = await Promise.all([
            supabase.from('categories').select('*').order('name'),
            supabase.from('colleges').select('*').order('name'),
            supabase
                .from('listings')
                .select(`
                    id,
                    title,
                    price,
                    condition,
                    images,
                    created_at,
                    views_count,
                    seller:profiles!listings_seller_id_fkey(full_name, avatar_url),
                    college:colleges(name)
                `, { count: 'exact' })
                .eq('is_active', true)
                .eq('is_sold', false)
                .order('created_at', { ascending: false })
                .limit(20)
        ])

        // Check for errors
        if (categoriesResult.error) {
            console.error('Server: Categories fetch error:', categoriesResult.error)
        }
        if (collegesResult.error) {
            console.error('Server: Colleges fetch error:', collegesResult.error)
        }
        if (listingsResult.error) {
            console.error('Server: Listings fetch error:', listingsResult.error)
            serverError = listingsResult.error.message
        }

        // Safe extraction with fallbacks
        categories = categoriesResult.data || []
        colleges = collegesResult.data || []
        initialListings = listingsResult.data || []
        totalCount = listingsResult.count || 0

        console.log('Server: Fetched data', {
            categories: categories.length,
            colleges: colleges.length,
            listings: initialListings.length,
            totalCount
        })

    } catch (error: any) {
        console.error('Server: Critical error in BrowsePage:', error)
        serverError = error.message || 'Failed to load data'
    }

    // Pass server-fetched data to client component
    // Even if fetch fails, we pass empty arrays so page doesn't crash
    return (
        <BrowseClient
            initialListings={initialListings}
            categories={categories}
            colleges={colleges}
            totalCount={totalCount}
            categoryFromUrl={searchParams.category || ''}
            serverError={serverError}
        />
    )
}
