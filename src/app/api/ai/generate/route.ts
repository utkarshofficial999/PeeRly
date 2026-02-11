import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * PRODUCTION-READY SambaNova AI Integration
 * Switched from Gemini to SambaNova (Llama-3.2-Vision)
 */

export async function POST(req: Request) {
    try {
        const apiKey = process.env.SAMBANOVA_API_KEY;

        if (!apiKey) {
            console.error("Missing SAMBANOVA_API_KEY environment variable");
            return NextResponse.json(
                { error: "AI Assistant configuration error: Missing SambaNova API Key." },
                { status: 500 }
            )
        }

        const body = await req.json().catch(() => ({}));
        const { notes, image, category } = body;

        // Prepare the prompt
        const promptText = `
            Act as a professional marketplace listing assistant for PeerLY (college marketplace).
            Generate a listing based on these details:
            - Category: ${category || 'General'}
            - User Notes: ${notes || 'Analyze the item'}
            
            Return ONLY a valid JSON object with EXACTLY this structure:
            {
              "title": "Short catchy title (max 50 chars)",
              "description": "Engaging description (max 300 chars)",
              "suggestedPrice": number (realistic INR price)
            }
        `

        // Prepare messages for SambaNova (OpenAI compatible format)
        const messages: any[] = [
            {
                role: "system",
                content: "You are a professional marketplace assistant. Always respond with valid JSON."
            }
        ];

        // Handle text and image content
        const userContent: any[] = [{ type: "text", text: promptText }];

        if (image && typeof image === 'string' && image.includes('base64,')) {
            userContent.push({
                type: "image_url",
                image_url: {
                    url: image // data:image/jpeg;base64,...
                }
            });
        }

        messages.push({
            role: "user",
            content: userContent
        });

        // Call SambaNova API
        const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "Llama-3.2-11B-Vision-Instruct",
                messages: messages,
                temperature: 0.1,
                top_p: 0.1,
                // Asking for JSON format directly if supported
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("SambaNova API Error:", errorData);
            throw new Error(errorData.error?.message || `SambaNova API failed with status ${response.status}`);
        }

        const result = await response.json();
        const text = result.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('SambaNova returned an empty response.');
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
        console.error('AI_GENERATION_FAILED:', error)

        let userMessage = "AI assistant is temporarily unavailable.";
        if (error.message) {
            userMessage = `AI Error: ${error.message}`;
        }

        return NextResponse.json(
            { error: userMessage },
            { status: 500 }
        )
    }
}
