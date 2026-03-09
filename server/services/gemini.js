const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10);
const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');

// Schema Definition
const stylingSchema = {
    type: SchemaType.OBJECT,
    properties: {
        suggestedOutfit: {
            type: SchemaType.OBJECT,
            properties: {
                shirt: { type: SchemaType.OBJECT, properties: { color: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, brand: { type: SchemaType.STRING } } },
                pants: { type: SchemaType.OBJECT, properties: { color: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, brand: { type: SchemaType.STRING } } },
                shoes: { type: SchemaType.OBJECT, properties: { color: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, brand: { type: SchemaType.STRING } } }
            }
        },
        hairstyle: {
            type: SchemaType.OBJECT,
            properties: { name: { type: SchemaType.STRING }, howTo: { type: SchemaType.STRING } }
        },
        accessories: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        colorPalette: {
            type: SchemaType.OBJECT,
            properties: { primary: { type: SchemaType.STRING }, secondary: { type: SchemaType.STRING }, accent: { type: SchemaType.STRING } }
        },
        whyItWorks: { type: SchemaType.STRING }
    },
    required: ["suggestedOutfit", "hairstyle", "accessories", "colorPalette", "whyItWorks"]
};

function getPrompt(gender, skinTone) {
    return `You are a professional luxury fashion stylist.
Analyze the user's photo with a ${skinTone.category} skin tone, identifying as ${gender}.
Provide personalized styling recommendations perfectly matching the required schema. Ensure the outfit, hairstyles, and accessories are suitable for their skin tone, taking into account contrast and harmony. Provide color palettes natively as hex values like #1F2E3A. Provide a brief rationale of why the combination works visually.`;
}

function getFallbackProfile(gender, skinTone) {
    return {
        suggestedOutfit: {
            shirt: { color: "Crisp White", type: "Classic Button-down", brand: "Ralph Lauren" },
            pants: { color: "Navy Blue", type: "Tailored Chinos", brand: "Bonobos" },
            shoes: { color: "Rich Brown", type: "Leather Loafers", brand: "Allen Edmonds" }
        },
        hairstyle: { name: "Classic Taper", howTo: "Keep the sides short and blend into a textured top. Style with a light matte pomade." },
        accessories: ["Silver Watch", "Leather Belt"],
        colorPalette: { primary: "#0F2A4A", secondary: "#FFFFFF", accent: "#8B4513" },
        whyItWorks: `This perfectly curated profile leverages deep navy and crisp whites to contrast elegantly against your ${skinTone.category} skin tone. This classic foundational wardrobe works effortlessly for any occasion while keeping you stylish.`
    };
}

async function callGeminiAPI(base64Image, gender, skinTone, retries = 2) {
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

            const prompt = getPrompt(gender, skinTone);

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: temperature,
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
                console.error(`Gemini API exhausted maximum retries. Injecting seamless fallback. Last Error: ${error.message}`);
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
