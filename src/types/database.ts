export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    avatar_url: string | null
                    college_id: string | null
                    college_email: string | null
                    is_verified: boolean
                    verification_status: 'pending' | 'approved' | 'rejected'
                    id_card_url: string | null
                    rejection_reason: string | null
                    phone: string | null
                    year: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    avatar_url?: string | null
                    college_id?: string | null
                    college_email?: string | null
                    is_verified?: boolean
                    phone?: string | null
                    year?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    avatar_url?: string | null
                    college_id?: string | null
                    college_email?: string | null
                    is_verified?: boolean
                    phone?: string | null
                    year?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            colleges: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    email_domain: string
                    location: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    logo_url?: string | null
                    email_domain: string
                    location?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    logo_url?: string | null
                    email_domain?: string
                    location?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            categories: {
                Row: {
                    id: number
                    name: string
                    slug: string
                    icon: string | null
                }
                Insert: {
                    id?: number
                    name: string
                    slug: string
                    icon?: string | null
                }
                Update: {
                    id?: number
                    name?: string
                    slug?: string
                    icon?: string | null
                }
            }
            listings: {
                Row: {
                    id: string
                    seller_id: string
                    title: string
                    description: string | null
                    price: number
                    category_id: number | null
                    condition: 'new' | 'like_new' | 'good' | 'fair'
                    images: string[]
                    college_id: string | null
                    location: string | null
                    is_active: boolean
                    approval_status: 'pending' | 'approved' | 'rejected'
                    rejection_reason: string | null
                    is_sold: boolean
                    views_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    seller_id: string
                    title: string
                    description?: string | null
                    price: number
                    category_id?: number | null
                    condition: 'new' | 'like_new' | 'good' | 'fair'
                    images?: string[]
                    college_id?: string | null
                    location?: string | null
                    is_active?: boolean
                    is_sold?: boolean
                    views_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    seller_id?: string
                    title?: string
                    description?: string | null
                    price?: number
                    category_id?: number | null
                    condition?: 'new' | 'like_new' | 'good' | 'fair'
                    images?: string[]
                    college_id?: string | null
                    location?: string | null
                    is_active?: boolean
                    is_sold?: boolean
                    views_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            saved_listings: {
                Row: {
                    user_id: string
                    listing_id: string
                    created_at: string
                }
                Insert: {
                    user_id: string
                    listing_id: string
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    listing_id?: string
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    listing_id: string | null
                    buyer_id: string
                    seller_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    listing_id?: string | null
                    buyer_id: string
                    seller_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string | null
                    buyer_id?: string
                    seller_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    reviewer_id: string
                    reviewed_id: string
                    listing_id: string | null
                    rating: number
                    comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    reviewer_id: string
                    reviewed_id: string
                    listing_id?: string | null
                    rating: number
                    comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    reviewer_id?: string
                    reviewed_id?: string
                    listing_id?: string | null
                    rating?: number
                    comment?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Convenient type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type College = Database['public']['Tables']['colleges']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

// Extended types with relations
export type ListingWithSeller = Listing & {
    seller: Profile
    category: Category | null
    college: College | null
}

export type ConversationWithDetails = Conversation & {
    listing: Listing | null
    buyer: Profile
    seller: Profile
    messages: Message[]
}
