import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        // Prioritize NEXT_PUBLIC version for broader availability across environments
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env['GEMINI_API_KEY'];

        if (!apiKey) {
            const envType = process.env.VERCEL_ENV || 'development/local';
            console.error(`ERROR: API Key missing in ${envType}.`);
            return NextResponse.json(
                { error: `AI Assistant Error: No key found in [${envType}]. Please verify project settings.` },
                { status: 500 }
            )
        }

        const { notes, image, category } = await req.json()
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

        // Prepare parts for multimodal prompt
        const promptText = `
            Act as a professional marketplace listing assistant for a college student marketplace called PeerLY.
            Based on the ${image ? 'provided image and ' : ''}user notes, generate a high-quality listing.

            Category: ${category || 'General'}
            Notes: ${notes || 'Analyze the item in the image'}

            Rules:
            1. Title: Catchy, under 60 chars.
            2. Description: Compelling, includes condition and key features.
            3. Price: Suggest a realistic price in INR (₹) for a college student.
            4. If image is provided, ensure details match what is visible.

            Respond strictly with JSON:
            {
              "title": "...",
              "description": "...",
              "suggestedPrice": 0
            }
        `

        const parts: any[] = [promptText]
        if (image) {
            const b64Data = image.split(',')[1]
            const mimeType = image.split(';')[0].split(':')[1]
            parts.push({
                inlineData: {
                    data: b64Data,
                    mimeType: mimeType
                }
            })
        }

        const result = await model.generateContent(parts)
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : text)

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('AI Generation Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate listing content' },
            { status: 500 }
        )
    }
}
