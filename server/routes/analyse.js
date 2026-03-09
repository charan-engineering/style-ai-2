const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { getSkinTone } = require('../services/skinTone');
const { analyzeStyle } = require('../services/gemini');
const { appendProducts } = require('../services/products');
const Jimp = require('jimp');

router.post('/', upload.single('image'), async (req, res) => {
    try {
        console.log('--- Processing Request ---');
        if (!req.file) {
            console.error('No file received');
            return res.status(400).json({ error: 'Image file is required.' });
        }

        const { gender, context } = req.body;
        console.log(`Gender: ${gender}, Context length: ${context ? context.length : 0}`);

        if (!gender || !['male', 'female', 'nonbinary'].includes(gender.toLowerCase())) {
            console.error('Invalid gender:', gender);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Gender is required and must be male, female, or nonbinary.' });
        }

        // 1. Process image with Jimp
        console.log('Step 1: Jimp Processing from memory...');
        const image = await Jimp.read(req.file.buffer);
        
        // Resize to 800px width, aspect ratio maintained
        image.resize(800, Jimp.AUTO);
        
        const processedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        const base64Image = processedImageBuffer.toString('base64');

        // 2. Skin tone detection
        console.log('Step 2: Skin Tone Detection...');
        const skinTone = await getSkinTone(req.file.buffer, processedImageBuffer);

        // 3. Gemini AI Analysis
        console.log('Step 3: Gemini API Call...');
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is not set in environment!');
            throw new Error('Server configuration error: Gemini key missing.');
        }
        
        const geminiResult = await analyzeStyle(base64Image, gender, skinTone, context);

        if (!geminiResult || !geminiResult.suggestedOutfit) {
            console.error('Gemini returned invalid structure:', geminiResult);
            throw new Error('AI analysis failed to provide an outfit.');
        }

        // 4. Product Recommendation Engine
        console.log('Step 4: Appending Products...');
        const enrichedResult = await appendProducts(geminiResult, gender, skinTone);

        console.log('Analysis Complete Successfully!');
        // Return full expanded response
        res.status(200).json({
            skinTone: skinTone,
            bodyType: enrichedResult.bodyType || "Not detected",
            seasonalTone: enrichedResult.seasonalTone || "Neutral",
            dressCodes: enrichedResult.dressCodes || ["Smart Casual", "Business", "Casual"],
            suggestedOutfit: enrichedResult.suggestedOutfit,
            hairstyle: enrichedResult.hairstyle,
            accessories: enrichedResult.accessories,
            colorPalette: enrichedResult.colorPalette,
            whyItWorks: enrichedResult.whyItWorks,
            products: enrichedResult.products || []
        });

    } catch (error) {
        console.error('SERVER CATCH BLOCK:', error.message);
        console.error(error.stack);

        // Return error response
        const status = error.message.includes('Invalid') || error.message.includes('required') ? 400 : 500;
        res.status(status).json({ 
            error: `Stylist Error: ${error.message}`,
            tip: "Check your Vercel Logs for the full traceback."
        });
    }
});

module.exports = router;
