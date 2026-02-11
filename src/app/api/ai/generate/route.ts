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
                { error: `AI Assistant Error: No key found in [${envType}]. Please verify Vercel settings.` },
                { status: 500 }
            )
        }

        const { notes, image, category } = await req.json()

        // Prepare prompt
        const promptText = `
            Act as a professional marketplace listing assistant for a college student marketplace called PeerLY.
            Generate a high-quality listing based on:
            - Category: ${category || 'General'}
            - User Notes: ${notes || 'Analyze the item'}
            - Image provided: ${image ? 'Yes' : 'No'}

            Rules:
            1. Title: Catchy, under 60 chars.
            2. Description: Compelling, includes condition and key features.
            3. Price: Suggest a realistic price in INR (₹) for a college student.
            4. If image is provided, ensure details match what is visible.

            Respond strictly with valid JSON:
            {
              "title": "...",
              "description": "...",
              "suggestedPrice": 0
            }
        `

        // Raw API request parts
        const contentsParts: any[] = [{ text: promptText }]

        if (image) {
            try {
                const b64Data = image.split(',')[1]
                const mimeType = image.split(';')[0].split(':')[1]
                contentsParts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: b64Data
                    }
                })
            } catch (err) {
                console.error('Image processing error:', err)
            }
        }

        // Use direct fetch to the v1 stable endpoint to bypass SDK beta issues
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: contentsParts
                }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', result);
            return NextResponse.json(
                { error: `Gemini API Error [v7]: ${result.error?.message || 'API request failed'}` },
                { status: response.status }
            )
        }

        // Extract text from the stable v1 response structure
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No content returned from Gemini');
        }

        // Parse JSON from text
        const firstBrace = generatedText.indexOf('{')
        const lastBrace = generatedText.lastIndexOf('}')
        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('AI response did not contain JSON');
        }
        const jsonStr = generatedText.substring(firstBrace, lastBrace + 1)
        const data = JSON.parse(jsonStr)

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('AI_GENERATION_FAILED_V7:', error)
        return NextResponse.json(
            { error: `AI Assistant Unavailable: ${error.message || 'Unknown network error'}` },
            { status: 500 }
        )
    }
}
