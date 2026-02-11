import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PRODUCTION-READY Gemini 2.0 Integration
 * This route handles AI generation for marketplace listings.
 * It uses the latest @google/generative-ai SDK and gemini-2.0-flash model.
 */

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY environment variable");
            return NextResponse.json(
                { error: "AI Assistant configuration error: Missing API Key." },
                { status: 500 }
            )
        }

        const { notes, image, category } = await req.json()

        // Initialize Gemini SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-2.0-flash for speed and cost-effectiveness
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            // Use JSON response mode for consistent parsing
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Prepare prompt
        const promptText = `
            Act as a professional marketplace listing assistant for a college student marketplace called PeerLY.
            Generate a high-quality listing based on the provided details.
            
            Category: ${category || 'General'}
            User Notes: ${notes || 'Analyze the item'}
            Image included: ${image ? 'Yes' : 'No'}

            Rules:
            1. Title: Catchy, under 60 chars.
            2. Description: Compelling, includes condition and key features.
            3. SuggestedPrice: Suggest a realistic price in INR (₹) for a college student. No currency symbols in the number.
            4. If an image is provided, ensure details match what is visible.

            Respond strictly with valid JSON following this schema:
            {
              "title": "string",
              "description": "string",
              "suggestedPrice": number
            }
        `

        // Prepare request parts
        const parts: any[] = [{ text: promptText }]

        // Handle image if provided (base64 string from frontend)
        if (image && typeof image === 'string' && image.includes(',')) {
            try {
                const [header, b64Data] = image.split(',')
                const mimeType = header.split(';')[0].split(':')[1]

                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: b64Data
                    }
                })
            } catch (err) {
                console.error('Image processing error:', err)
                // Continue without image if processing fails
            }
        }

        // Generate content
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new Error('AI failed to generate a response');
        }

        // Parse and return the generated JSON
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error('Failed to parse Gemini JSON response:', text);
            // Fallback parsing if JSON mode fails for some reason
            const firstBrace = text.indexOf('{')
            const lastBrace = text.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1) {
                const cleanedJson = text.substring(firstBrace, lastBrace + 1)
                return NextResponse.json(JSON.parse(cleanedJson));
            }
            throw new Error('AI response was not valid JSON');
        }

    } catch (error: any) {
        console.error('AI_GENERATION_FAILED:', error)

        // Return a structured error that the UI can handle gracefully
        const errorMessage = error.message?.includes('API key')
            ? 'Invalid API configuration. Please contact admin.'
            : 'AI assistant is temporarily unavailable. Please try again.';

        return NextResponse.json(
            { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error.message : undefined },
            { status: 500 }
        )
    }
}
