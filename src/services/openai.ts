import type { ParsedData, Category, CategoryMatchResult } from '../types';

const PARSE_SYSTEM_PROMPT = `You are a productivity data extractor. Analyze the user's note and extract structured data. Return ONLY valid JSON with this exact structure:
{
  "activity": "brief activity description",
  "duration_minutes": number or null,
  "sentiment": "positive, neutral, or negative"
}
Rules:
- If no time is mentioned, set duration_minutes to null
- Keep activity description concise (under 50 chars)
- Base sentiment on the tone of the note`;

const MATCH_SYSTEM_PROMPT = `You are a smart category matcher for a productivity tracking app. Your job is to determine if a new activity fits into existing categories or needs a new one.

Rules:
- Check if this activity semantically fits into any existing category
- Consider synonyms and related concepts (e.g., 'jogging' fits 'Fitness', 'coding tutorial' fits 'Learning')
- Use a confidence threshold of 70% - if less confident, suggest a new category
- If suggesting a new category, it MUST be a single, broad classification (e.g. "Fitness", NOT "Running/Cardio")
- Category names should be: Single word or short phrase, Capitalized, Generic not specific
- Do NOT return multiple options. Pick the single best fit.

Return ONLY valid JSON in this format:
If it matches existing category:
{
"matches": true,
"category_name": "Existing Category Name",
"confidence": 85,
"reasoning": "Brief explanation why it matches"
}
If it needs a new category:
{
"matches": false,
"suggested_category": "Proposed Category Name",
"confidence": 45,
"reasoning": "Why existing categories don't fit and why this name is appropriate"
}`;

export interface ParseResult {
    parsed: ParsedData;
    error?: string;
}

export async function parseEntryWithAI(text: string): Promise<ParseResult> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        return {
            parsed: { activity: text, duration_minutes: null, sentiment: 'neutral' },
            error: 'API Key is missing. Please add VITE_OPENAI_API_KEY to your .env file.'
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: PARSE_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                temperature: 0.3,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) throw new Error('No content received from AI');

        const cleanedContent = content.replace(/```json\n?|```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedContent);
            return { parsed: { ...parsed, category: undefined } }; // Ensure no category is returned here
        } catch (e) {
            console.error("JSON Parse Error", content);
            throw new Error('Failed to parse AI response');
        }

    } catch (error) {
        console.error("AI Parsing failed", error);
        return {
            parsed: { activity: text, duration_minutes: null, sentiment: 'neutral' },
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function matchCategory(activity: string, existingCategories: Category[]): Promise<CategoryMatchResult> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const categoryNames = existingCategories.map(c => c.name).join(', ');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: MATCH_SYSTEM_PROMPT },
                    { role: "user", content: `Activity: ${activity}, Existing categories: ${categoryNames}` }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) throw new Error("AI Match failed");

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        const cleanedContent = content.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanedContent);

    } catch (error) {
        console.error("AI Matching failed", error);
        // Fallback: No match, no suggestion
        return { matches: false, confidence: 0, reasoning: "AI Error", suggested_category: "Uncategorized" };
    }
}
