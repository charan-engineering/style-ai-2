const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10);
const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.9');

// Expanded Schema — forces unique, detailed, image-specific answers
const stylingSchema = {
    type: SchemaType.OBJECT,
    properties: {
        bodyType: {
            type: SchemaType.STRING,
            description: "Detected body type from the image, e.g. Athletic, Slim, Average, Stocky, Tall-Lean"
        },
        seasonalTone: {
            type: SchemaType.STRING,
            description: "Color season analysis: Warm Spring, Warm Autumn, Cool Summer, Cool Winter, Neutral"
        },
        dressCodes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "3-5 dress codes this person can pull off well, e.g. Smart Casual, Streetwear, Business Formal, Athleisure, Bohemian"
        },
        suggestedOutfit: {
            type: SchemaType.OBJECT,
            properties: {
                shirt: {
                    type: SchemaType.OBJECT,
                    properties: {
                        color: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING },
                        brand: { type: SchemaType.STRING },
                        hexColor: { type: SchemaType.STRING, description: "Hex color code of the shirt e.g. #2C3E50" }
                    }
                },
                pants: {
                    type: SchemaType.OBJECT,
                    properties: {
                        color: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING },
                        brand: { type: SchemaType.STRING },
                        hexColor: { type: SchemaType.STRING }
                    }
                },
                shoes: {
                    type: SchemaType.OBJECT,
                    properties: {
                        color: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING },
                        brand: { type: SchemaType.STRING },
                        hexColor: { type: SchemaType.STRING }
                    }
                }
            }
        },
        hairstyle: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING },
                howTo: { type: SchemaType.STRING }
            }
        },
        accessories: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        colorPalette: {
            type: SchemaType.OBJECT,
            properties: {
                primary: { type: SchemaType.STRING, description: "Hex color code" },
                primaryName: { type: SchemaType.STRING, description: "Human name like 'Midnight Navy'" },
                secondary: { type: SchemaType.STRING },
                secondaryName: { type: SchemaType.STRING },
                accent: { type: SchemaType.STRING },
                accentName: { type: SchemaType.STRING },
                neutral: { type: SchemaType.STRING },
                neutralName: { type: SchemaType.STRING },
                highlight: { type: SchemaType.STRING },
                highlightName: { type: SchemaType.STRING }
            }
        },
        whyItWorks: { type: SchemaType.STRING }
    },
    required: ["bodyType", "seasonalTone", "dressCodes", "suggestedOutfit", "hairstyle", "accessories", "colorPalette", "whyItWorks"]
};

function getPrompt(gender, skinTone, context) {
    const timestamp = Date.now(); // Forces uniqueness per request
    
    let contextInstructions = "";
    if (context && context.trim() !== '') {
        contextInstructions = `
CRITICAL USER CONTEXT (OCCASION / PREFERENCES):
The user has provided the following specific constraints, occasion details, or preferences:
"${context.trim()}"
You MUST strictly follow these instructions and tailor the outfit specifically for this occasion.
`;
    }

    return `You are an elite personal fashion consultant with 20 years of expertise in color theory, body styling, and modern fashion.
${contextInstructions}

CRITICAL INSTRUCTION: You MUST analyze the SPECIFIC person in this photo. Do NOT give generic or default recommendations. Every single suggestion must be based on what you actually observe in this image.

Analyze the following about THIS SPECIFIC person in the photo:
- Their exact skin tone (detected as: ${skinTone.category}, RGB: ${skinTone.rgb.join(',')})
- Their approximate body type (slim, athletic, average, stocky, etc.)
- Their face shape and natural features
- Their current hair color, texture, and length
- Their apparent age range and personal vibe
- Any existing clothing or style cues visible

Gender identity: ${gender}

Based on YOUR UNIQUE ANALYSIS of this specific individual, provide:
1. Body type classification based on what you see
2. Seasonal color analysis (Warm Spring/Autumn or Cool Summer/Winter)
3. 3-5 dress codes they would excel at
4. A SPECIFIC outfit recommendation with exact colors (as hex codes), garment types, and brand suggestions tailored to their body and tone
5. A hairstyle that complements THEIR specific face shape and hair texture
6. 3-5 accessories that match the overall look
7. A personalized 5-color palette (primary, secondary, accent, neutral, highlight) with human-readable names and hex codes — these must harmonize with THEIR skin tone
8. A detailed explanation of why this combination works for THIS person specifically

Remember: Every recommendation must be UNIQUE to this person. Two different people should get completely different results. Reference specific visual details you see in the photo.

Request ID: ${timestamp}`;
}

function getFallbackProfile(gender, skinTone) {
    const profiles = {
        Fair: {
            bodyType: "Average",
            seasonalTone: "Cool Summer",
            dressCodes: ["Smart Casual", "Preppy", "Scandinavian Minimalist"],
            suggestedOutfit: {
                shirt: { color: "Soft Lavender", type: "Linen Button-down", brand: "COS", hexColor: "#B8A9C9" },
                pants: { color: "Stone Grey", type: "Relaxed Chinos", brand: "Arket", hexColor: "#8E8E8E" },
                shoes: { color: "Off-White", type: "Leather Sneakers", brand: "Common Projects", hexColor: "#F5F0EB" }
            },
            hairstyle: { name: "Soft Textured Quiff", howTo: "Apply sea salt spray to damp hair and blow dry with a round brush, pushing upward at the front." },
            accessories: ["Silver Minimalist Watch", "Linen Pocket Square", "Tortoiseshell Sunglasses"],
            colorPalette: { primary: "#4A5568", primaryName: "Slate Grey", secondary: "#B8A9C9", secondaryName: "Soft Lavender", accent: "#2D3748", accentName: "Charcoal", neutral: "#F5F0EB", neutralName: "Warm Ivory", highlight: "#9F7AEA", highlightName: "Muted Violet" },
            whyItWorks: "Cool-toned lavender and slate complement fair skin beautifully, creating a sophisticated contrast without overwhelming delicate undertones."
        },
        Medium: {
            bodyType: "Athletic",
            seasonalTone: "Warm Autumn",
            dressCodes: ["Business Casual", "Urban Modern", "Date Night"],
            suggestedOutfit: {
                shirt: { color: "Burnt Terracotta", type: "Structured Polo", brand: "Ted Baker", hexColor: "#C1440E" },
                pants: { color: "Dark Olive", type: "Slim Tapered Trousers", brand: "Theory", hexColor: "#3C4A2E" },
                shoes: { color: "Cognac Brown", type: "Chelsea Boots", brand: "R.M. Williams", hexColor: "#8B4513" }
            },
            hairstyle: { name: "Modern Side Part", howTo: "Use a medium-hold pomade and comb to the side, keeping the transition smooth with a low fade." },
            accessories: ["Leather Braided Bracelet", "Gold-Tone Aviator Sunglasses", "Canvas Weekender Bag"],
            colorPalette: { primary: "#C1440E", primaryName: "Burnt Terracotta", secondary: "#3C4A2E", secondaryName: "Dark Olive", accent: "#D4A76A", accentName: "Golden Camel", neutral: "#2D2114", neutralName: "Espresso", highlight: "#E8C07A", highlightName: "Warm Gold" },
            whyItWorks: "Rich earth tones like terracotta and olive naturally harmonize with medium skin, creating a warm, approachable look with depth."
        },
        Olive: {
            bodyType: "Slim",
            seasonalTone: "Warm Spring",
            dressCodes: ["Mediterranean Chic", "Smart Casual", "Resort Wear"],
            suggestedOutfit: {
                shirt: { color: "Dusty Rose", type: "Camp Collar Shirt", brand: "Sandro", hexColor: "#C9A0A0" },
                pants: { color: "Cream Beige", type: "Wide-Leg Linen Trousers", brand: "Massimo Dutti", hexColor: "#F1E6D0" },
                shoes: { color: "Tan", type: "Woven Leather Loafers", brand: "Magnanni", hexColor: "#C19A6B" }
            },
            hairstyle: { name: "Textured Mediterranean Waves", howTo: "Apply curl cream to towel-dried hair. Scrunch and air dry, then define waves with a diffuser." },
            accessories: ["Rose Gold Watch", "Woven Straw Fedora", "Leather Braided Belt"],
            colorPalette: { primary: "#C9A0A0", primaryName: "Dusty Rose", secondary: "#F1E6D0", secondaryName: "Warm Cream", accent: "#7D6B5D", accentName: "Warm Taupe", neutral: "#3B3028", neutralName: "Dark Umber", highlight: "#E8B4B8", highlightName: "Blush Pink" },
            whyItWorks: "Warm pinks and creamy neutrals complement olive undertones by adding warmth without clashing with the natural green-yellow hue."
        },
        Deep: {
            bodyType: "Athletic",
            seasonalTone: "Cool Winter",
            dressCodes: ["Modern Luxe", "Streetwear Elevated", "Power Dressing"],
            suggestedOutfit: {
                shirt: { color: "Royal Cobalt", type: "Structured Knit Tee", brand: "Reiss", hexColor: "#1E40AF" },
                pants: { color: "Jet Black", type: "Tailored Slim Trousers", brand: "Hugo Boss", hexColor: "#1A1A1A" },
                shoes: { color: "Burgundy Wine", type: "Leather Derby Shoes", brand: "Church's", hexColor: "#722F37" }
            },
            hairstyle: { name: "Clean High Fade", howTo: "Keep the top 2-3 inches with defined curls or waves. Fade the sides to a skin-tight #0.5, blending into the top." },
            accessories: ["Gunmetal Chain Bracelet", "Black Ceramic Watch", "Structured Leather Tote"],
            colorPalette: { primary: "#1E40AF", primaryName: "Royal Cobalt", secondary: "#1A1A1A", secondaryName: "Jet Black", accent: "#722F37", accentName: "Burgundy Wine", neutral: "#E2E8F0", neutralName: "Cool Silver", highlight: "#F59E0B", highlightName: "Amber Gold" },
            whyItWorks: "Bold cobalt blue and deep burgundy create striking contrast against deep skin tones, making the wearer stand out with regal confidence."
        }
    };

    return profiles[skinTone.category] || profiles['Medium'];
}

async function callGeminiAPI(base64Image, gender, skinTone, context, retries = 2) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        throw new Error('Server configuration error: GEMINI_API_KEY is missing or invalid in the .env file.');
    }

    let attempt = 0;
    while (attempt <= retries) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/jpeg'
                }
            };

            const prompt = getPrompt(gender, skinTone, context);

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
                    topP: 0.95,
                    responseMimeType: "application/json",
                    responseSchema: stylingSchema,
                }
            });

            let responseText = result.response.text().trim();
            if (responseText.startsWith('```json')) {
                responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (responseText.startsWith('```')) {
                responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            console.log('Raw Gemini Output:', responseText);
            const parsed = JSON.parse(responseText);
            return parsed;
        } catch (error) {
            console.warn(`Gemini API Attempt ${attempt + 1} failed:`, error.message);
            if (attempt === retries) {
                console.error(`Gemini API exhausted maximum retries. Injecting fallback. Last Error: ${error.message}`);
                return getFallbackProfile(gender, skinTone);
            }
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            attempt++;
        }
    }
}

module.exports = {
    analyzeStyle: callGeminiAPI
};
