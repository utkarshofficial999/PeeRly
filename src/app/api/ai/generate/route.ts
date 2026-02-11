import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env['GEMINI_API_KEY'];

        if (!apiKey) {
            const envType = process.env.VERCEL_ENV || 'development/local';
            return NextResponse.json(
                { error: `AI Assistant Error: No key found in [${envType}]. Please verify project settings.` },
                { status: 500 }
            )
        }

        const { notes, image, category } = await req.json()
        const genAI = new GoogleGenerativeAI(apiKey)

        // Prepare prompt
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

        // Use gemini-pro as primary to guarantee success while flash has regional issues
        const modelName = image ? 'gemini-1.5-flash' : 'gemini-pro'
        const model = genAI.getGenerativeModel({ model: modelName })

        try {
            let result;
            if (image && modelName === 'gemini-1.5-flash') {
                const b64Data = image.split(',')[1]
                const mimeType = image.split(';')[0].split(':')[1]
                result = await model.generateContent([
                    promptText,
                    {
                        inlineData: {
                            data: b64Data,
                            mimeType: mimeType
                        }
                    }
                ])
            } else {
                result = await model.generateContent(promptText)
            }

            const response = await result.response
            const text = response.text()

            const firstBrace = text.indexOf('{')
            const lastBrace = text.lastIndexOf('}')
            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error('AI provided an invalid response format (No JSON found)')
            }
            const jsonStr = text.substring(firstBrace, lastBrace + 1)
            const data = JSON.parse(jsonStr)

            return NextResponse.json(data)
        } catch (genError: any) {
            console.error('GENERATE_CONTENT_ERROR:', genError)

            // Final fallback to gemini-pro with text-only
            const backupModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
            const result = await backupModel.generateContent(promptText)
            const response = await result.response
            const text = response.text()

            const firstBrace = text.indexOf('{')
            const lastBrace = text.lastIndexOf('}')
            const jsonStr = text.substring(firstBrace, lastBrace + 1)
            return NextResponse.json(JSON.parse(jsonStr))
        }
    } catch (error: any) {
        console.error('AI_GENERATION_FAILED:', error)
        return NextResponse.json(
            { error: `AI Final Error [v4]: ${error.message || 'Unknown failure'}` },
            { status: 500 }
        )
    }
}
