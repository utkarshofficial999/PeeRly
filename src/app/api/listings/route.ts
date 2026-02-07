import { createBrowserClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Use Vercel Edge for faster response

interface ListingsQuery {
    category?: string
    condition?: string
    priceMin?: string
    priceMax?: string
    college?: string
    search?: string
    sortBy?: string
    offset?: number
    limit?: number
}

// Edge-compatible Supabase client
function getSupabaseClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const query: ListingsQuery = {
            category: searchParams.get('category') || undefined,
            condition: searchParams.get('condition') || undefined,
            priceMin: searchParams.get('priceMin') || undefined,
            priceMax: searchParams.get('priceMax') || undefined,
            college: searchParams.get('college') || undefined,
            search: searchParams.get('search') || undefined,
            sortBy: searchParams.get('sortBy') || 'newest',
            offset: parseInt(searchParams.get('offset') || '0'),
            limit: parseInt(searchParams.get('limit') || '20'),
        }

        const supabase = getSupabaseClient()

        // Build query with proper indexes
        let dbQuery = supabase
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

        // Apply filters
        if (query.category) {
            const { data: categoryData } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', query.category)
                .single()

            if (categoryData) {
                dbQuery = dbQuery.eq('category_id', categoryData.id)
            }
        }

        if (query.condition) {
            dbQuery = dbQuery.eq('condition', query.condition)
        }

        if (query.priceMin) {
            dbQuery = dbQuery.gte('price', parseFloat(query.priceMin))
        }

        if (query.priceMax) {
            dbQuery = dbQuery.lte('price', parseFloat(query.priceMax))
        }

        if (query.college) {
            const { data: collegeData } = await supabase
                .from('colleges')
                .select('id')
                .eq('slug', query.college)
                .single()

            if (collegeData) {
                dbQuery = dbQuery.eq('college_id', collegeData.id)
            }
        }

        if (query.search) {
            dbQuery = dbQuery.ilike('title', `%${query.search}%`)
        }

        // Apply sorting
        switch (query.sortBy) {
            case 'newest':
                dbQuery = dbQuery.order('created_at', { ascending: false })
                break
            case 'oldest':
                dbQuery = dbQuery.order('created_at', { ascending: true })
                break
            case 'price_low':
                dbQuery = dbQuery.order('price', { ascending: true })
                break
            case 'price_high':
                dbQuery = dbQuery.order('price', { ascending: false })
                break
            case 'popular':
                dbQuery = dbQuery.order('views_count', { ascending: false })
                break
            default:
                dbQuery = dbQuery.order('created_at', { ascending: false })
        }

        // Apply pagination
        dbQuery = dbQuery.range(query.offset || 0, (query.offset || 0) + (query.limit || 20) - 1)

        const { data, error, count } = await dbQuery

        if (error) {
            console.error('Supabase query error:', error)
            return NextResponse.json(
                { error: error.message, data: [], count: 0 },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: data || [],
            count: count || 0,
            hasMore: count ? count > (query.offset || 0) + (query.limit || 20) : false
        })

    } catch (error: any) {
        console.error('API route error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error', data: [], count: 0 },
            { status: 500 }
        )
    }
}
