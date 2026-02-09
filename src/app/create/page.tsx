'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Camera, Plus, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

const categories = [
    { id: 1, name: 'Textbooks', slug: 'textbooks', icon: '📚' },
    { id: 2, name: 'Electronics', slug: 'electronics', icon: '💻' },
    { id: 3, name: 'Cycles', slug: 'cycles', icon: '🚲' },
    { id: 4, name: 'Furniture', slug: 'furniture', icon: '🪑' },
    { id: 5, name: 'Clothing', slug: 'clothing', icon: '👕' },
    { id: 6, name: 'Sports', slug: 'sports', icon: '⚽' },
    { id: 7, name: 'Music', slug: 'music', icon: '🎸' },
    { id: 8, name: 'Other', slug: 'other', icon: '📦' },
]

const conditions = [
    { value: 'new', label: 'Brand New', description: 'Never used, with original packaging' },
    { value: 'like_new', label: 'Like New', description: 'Used once or twice, no visible wear' },
    { value: 'good', label: 'Good', description: 'Some signs of use, fully functional' },
    { value: 'fair', label: 'Fair', description: 'Visible wear, still works well' },
]

export default function CreateListingPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dbCategories, setDbCategories] = useState<any[]>([])

    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: '',
        price: '',
        condition: '',
        location: '',
    })

    // Fetch categories from DB
    useEffect(() => {
        let isMounted = true
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase.from('categories').select('*')
                if (error) {
                    console.error('Supabase categories error:', error)
                    return
                }
                if (isMounted && data) {
                    console.log('Fetched categories:', data.length)
                    setDbCategories(data)
                }
            } catch (err) {
                console.error('Error fetching categories:', err)
            }
        }
        fetchCategories()
        return () => { isMounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (images.length + files.length > 5) {
            alert('Maximum 5 images allowed')
            return
        }

        const newImages = [...images, ...files].slice(0, 5)
        setImages(newImages)

        // Create previews
        const previews = newImages.map(file => URL.createObjectURL(file))
        setImagePreviews(previews)
    }

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        const newPreviews = imagePreviews.filter((_, i) => i !== index)
        setImages(newImages)
        setImagePreviews(newPreviews)
    }

    const handleSubmit = async () => {
        if (!user || !profile) {
            setError('You must be logged in to create a listing')
            return
        }

        setIsLoading(true)
        setError(null)
        console.log('Starting listing submission...')

        try {
            const uploadedImageUrls: string[] = []

            // 1. Upload Images
            console.log(`Uploading ${images.length} images...`)
            for (let i = 0; i < images.length; i++) {
                const file = images[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                console.log(`Uploading image ${i + 1}/${images.length}: ${filePath}`)

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('listings')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Image upload failed:', uploadError)
                    throw new Error(`Failed to upload images. Please check if the "listings" storage bucket is created in Supabase. (Error: ${uploadError.message})`)
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('listings')
                    .getPublicUrl(filePath)

                uploadedImageUrls.push(publicUrl)
                console.log('Image uploaded successfully:', publicUrl)
            }

            // 2. Map category slug to ID
            // Fallback: If DB categories are empty, try to match by hardcoded IDs or name
            let selectedCat = dbCategories.find((c: any) => c.slug === formData.category)

            if (!selectedCat) {
                console.warn('Category not found in DB categories, checking fallback...')
                // Attempt to fetch again or use a default if critical
                const { data: freshCats } = await supabase.from('categories').select('*')
                selectedCat = freshCats?.find((c: any) => c.slug === formData.category)
            }

            if (!selectedCat) {
                throw new Error(`Category "${formData.category}" not found in database. Please ensure you have run the schema.sql script.`)
            }

            // 3. Insert Listing
            console.log('Inserting listing record into database...')
            const listingData = {
                seller_id: user.id,
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                category_id: selectedCat.id,
                condition: formData.condition,
                images: uploadedImageUrls,
                college_id: profile.college_id,
                location: formData.location,
                is_active: true
            }

            console.log('Listing details:', listingData)

            const { data: listing, error: insertError } = await supabase
                .from('listings')
                .insert(listingData)
                .select()
                .single()

            if (insertError) {
                console.error('Database insertion failed:', insertError)
                throw new Error(`Failed to save listing: ${insertError.message}`)
            }

            console.log('Listing created successfully!', listing)
            router.push('/dashboard?created=true')
        } catch (err: any) {
            console.error('Full submission error details:', err)

            // Ignore abort errors which are common in dev HMR
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                console.log('Submission aborted (likely HMR)')
                return
            }

            setError(err.message || 'Something went wrong. Please check your internet connection and try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const canProceed = () => {
        switch (step) {
            case 1: return formData.category !== ''
            case 2: return formData.title && formData.price && formData.condition
            case 3: return images.length > 0
            default: return true
        }
    }

    return (
        <div className="min-h-screen bg-surface-50">
            <Header />

            <main className="pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${s < step
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : s === step
                                        ? 'bg-primary-50 text-primary-600 border-2 border-primary-600'
                                        : 'bg-surface-200 text-surface-400'
                                    }`}>
                                    {s < step ? <Check className="w-5 h-5" /> : s}
                                </div>
                                {s < 4 && (
                                    <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${s < step ? 'bg-primary-600' : 'bg-surface-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 animate-shake">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="premium-card p-4 md:p-8">
                        {/* Step 1: Category */}
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-black text-surface-900 mb-2">
                                    What are you selling?
                                </h2>
                                <p className="text-surface-700 mb-8 font-bold">Select a category for your item</p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat.slug }))}
                                            className={`p-4 rounded-2xl border transition-all text-center ${formData.category === cat.slug
                                                ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-sm'
                                                : 'bg-surface-50 border-surface-200 text-surface-700 hover:border-primary-300 hover:bg-white'
                                                }`}
                                        >
                                            <span className="text-2xl mb-2 block">{cat.icon}</span>
                                            <span className="text-sm font-black">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {step === 2 && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-surface-900 mb-2">
                                        Item Details
                                    </h2>
                                    <p className="text-surface-700 font-bold">Tell buyers about your item</p>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-black text-surface-700 mb-2">
                                        Title <span className="text-peach-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Engineering Mathematics by B.S. Grewal"
                                        maxLength={100}
                                        className="input-field"
                                    />
                                    <p className="mt-1 text-xs text-surface-400 font-bold">{formData.title.length}/100 characters</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-black text-surface-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Describe your item... Include any defects, accessories, or special features"
                                        rows={4}
                                        maxLength={500}
                                        className="input-field resize-none"
                                    />
                                    <p className="mt-1 text-xs text-surface-400 font-bold">{formData.description.length}/500 characters</p>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-black text-surface-700 mb-2">
                                        Price <span className="text-peach-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-900 font-black">₹</span>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="0"
                                            min="0"
                                            className="input-field pl-8"
                                        />
                                    </div>
                                </div>

                                {/* Condition */}
                                <div>
                                    <label className="block text-sm font-black text-surface-700 mb-3">
                                        Condition <span className="text-peach-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {conditions.map((cond) => (
                                            <label
                                                key={cond.value}
                                                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.condition === cond.value
                                                    ? 'bg-primary-50 border-primary-600 shadow-sm'
                                                    : 'bg-surface-50 border-surface-200 hover:border-surface-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="condition"
                                                    value={cond.value}
                                                    checked={formData.condition === cond.value}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                                                    className="mt-0.5"
                                                />
                                                <div>
                                                    <p className="font-black text-surface-900">{cond.label}</p>
                                                    <p className="text-sm text-surface-700 font-bold">{cond.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-black text-surface-700 mb-2">
                                        Meeting Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="e.g., Main Gate, Library, Hostel Block A"
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Images */}
                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-black text-surface-900 mb-2">
                                    Add Photos
                                </h2>
                                <p className="text-surface-700 mb-8 font-bold">Add up to 5 photos. First photo will be the cover.</p>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Image Previews */}
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-surface-100 border border-surface-200">
                                            <Image src={preview} alt="Preview" fill className="object-cover" />
                                            <button
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-500/90 rounded text-xs font-medium text-white">
                                                    Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add More Button */}
                                    {images.length < 5 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-square rounded-2xl border-2 border-dashed border-surface-200 hover:border-primary-500/50 flex flex-col items-center justify-center text-surface-400 hover:text-primary-600 transition-all bg-surface-50 hover:bg-primary-50/30"
                                        >
                                            <Plus className="w-8 h-8 mb-2" />
                                            <span className="text-sm font-black tracking-tighter uppercase">Add Photo</span>
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                <p className="mt-4 text-sm text-surface-500 font-bold">
                                    Tip: Good photos get 3x more views. Use good lighting and show the item clearly.
                                </p>
                            </div>
                        )}

                        {/* Step 4: Preview */}
                        {step === 4 && (
                            <div className="animate-fade-in">
                                <h2 className="text-2xl font-black text-surface-900 mb-2">
                                    Review Your Listing
                                </h2>
                                <p className="text-surface-700 mb-8 font-bold">Make sure everything looks good before posting</p>

                                {/* Preview Card */}
                                <div className="bg-surface-50 border border-surface-100 rounded-2xl overflow-hidden shadow-soft">
                                    {imagePreviews[0] && (
                                        <div className="w-full aspect-video relative">
                                            <Image src={imagePreviews[0]} alt="Preview" fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="badge-primary mb-3">
                                            {categories.find(c => c.slug === formData.category)?.name}
                                        </div>
                                        <h3 className="text-xl font-black text-surface-900 mb-2">{formData.title}</h3>
                                        <p className="text-3xl font-black text-primary-600 mb-4">₹{formData.price}</p>
                                        {formData.description && (
                                            <p className="text-surface-700 font-medium mb-4">{formData.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-3 text-sm text-surface-600">
                                            <span className="px-4 py-1.5 bg-surface-100 rounded-full font-bold border border-surface-200">
                                                {conditions.find(c => c.value === formData.condition)?.label}
                                            </span>
                                            {formData.location && (
                                                <span className="px-4 py-1.5 bg-surface-100 rounded-full font-bold border border-surface-200">
                                                    📍 {formData.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="btn-secondary"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 4 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={!canProceed()}
                                    className="btn-primary"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="btn-primary"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Post Listing
                                            <Check className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
