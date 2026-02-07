import { Suspense } from 'react'
import BrowseClient from './BrowseClient'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// This is a Server Component - runs on Vercel's server, not in browser
export default async function BrowsePage({ searchParams }: { searchParams: { category?: string } }) {
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

    // Safe extraction with fallbacks
    const categories = categoriesResult.data || []
    const colleges = collegesResult.data || []
    const initialListings = listingsResult.data || []
    const totalCount = listingsResult.count || 0

    // Pass server-fetched data to client component
    return (
        <BrowseClient
            initialListings={initialListings}
            categories={categories}
            colleges={colleges}
            totalCount={totalCount}
            categoryFromUrl={searchParams.category || ''}
        />
    )
}
