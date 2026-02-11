import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PRODUCTION-READY Gemini Integration
 * Updated for maximum compatibility and robust error reporting.
 */

export async function POST(req: Request) {
    try {
        // Support multiple naming conventions for the API key to avoid Vercel config mismatches
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing Gemini API Key in environment variables");
            return NextResponse.json(
                { error: "AI Configuration Error: GEMINI_API_KEY is missing in Vercel/Local environment variables." },
                { status: 500 }
            )
        }

        const body = await req.json().catch(() => ({}));
        const { notes, image, category } = body;

        // Initialize Gemini SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        /**
         * Use gemini-1.5-flash as the primary stable model. 
         * It supports the v1 stable API and is widely available.
         */
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });

        // Prepare prompt
        const promptText = `
            Act as a professional marketplace listing assistant for PeerLY (college marketplace).
            Generate a listing based on these details:
            - Category: ${category || 'General'}
            - Notes: ${notes || 'Analyze the item'}
            
            Return ONLY a valid JSON object with:
            {
              "title": "Short catchy title (max 50 chars)",
              "description": "Engaging description (max 300 chars)",
              "suggestedPrice": number (realistic INR price)
            }
        `

        // Prepare content parts
        const parts: any[] = [{ text: promptText }]

        // Robust image handling
        if (image && typeof image === 'string' && image.includes('base64,')) {
            try {
                const parts_img = image.split(';base64,');
                const mimeType = parts_img[0].split(':')[1];
                const data = parts_img[1];

                if (mimeType && data) {
                    parts.push({
                        inlineData: {
                            mimeType,
                            data
                        }
                    });
                }
            } catch (err) {
                console.warn('Image skip: Malformed base64 data');
            }
        }

        // Call Gemini
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Gemini returned an empty response.');
        }

        // Robust JSON extraction
        try {
            // Try direct parse first
            return NextResponse.json(JSON.parse(text));
        } catch (e) {
            // Fallback: search for JSON block
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                return NextResponse.json(JSON.parse(match[0]));
            }
            throw new Error(`Invalid AI response format: ${text.substring(0, 100)}`);
        }

    } catch (error: any) {
        console.error('AI_ERROR:', error);

        // Provide more descriptive error for debugging in the UI
        let userMessage = "AI assistant is temporarily unavailable.";

        if (error.message?.includes('404') || error.message?.includes('not found')) {
            userMessage = "AI model error: The requested Gemini model is not accessible. Please check your API key region/permisons.";
        } else if (error.message?.includes('API key')) {
            userMessage = "AI Authentication failed: The provided API key is invalid or restricted.";
        } else if (error.message) {
            userMessage = `AI Error: ${error.message}`;
        }

        return NextResponse.json(
            { error: userMessage },
            { status: 500 }
        )
    }
}
