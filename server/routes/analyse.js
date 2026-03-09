const express = require('express');
const router = express.Router();
const fs = require('fs');
const upload = require('../middleware/upload');
const { getSkinTone } = require('../services/skinTone');
const { analyzeStyle } = require('../services/gemini');
const { appendProducts } = require('../services/products');
const sharp = require('sharp');

router.post('/', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required.' });
        }

        const { gender } = req.body;
        if (!gender || !['male', 'female', 'nonbinary'].includes(gender.toLowerCase())) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Gender is required and must be male, female, or nonbinary.' });
        }

        // 1. Process image with Sharp
        const processedImageBuffer = await sharp(req.file.path)
            .resize(800, null, { withoutEnlargement: true })
            .toFormat('jpeg')
            .toBuffer();

        const base64Image = processedImageBuffer.toString('base64');

        // 2. Skin tone detection
        const skinTone = await getSkinTone(req.file.path, processedImageBuffer);

        // 3. Gemini AI Analysis
        // Implement auto-retry inside analysis function
        const geminiResult = await analyzeStyle(base64Image, gender, skinTone);

        if (!geminiResult || !geminiResult.suggestedOutfit) {
            throw new Error('Invalid response structure from Gemini.');
        }

        // 4. Product Recommendation Engine
        const enrichedResult = await appendProducts(geminiResult, gender, skinTone);

        // 5. Clean up temporary file
        fs.unlinkSync(req.file.path);

        // Return successfully
        res.status(200).json({
            skinTone: skinTone,
            dressCodes: enrichedResult.dressCodes || ["Formal", "Business", "Casual", "Party"],
            suggestedOutfit: enrichedResult.suggestedOutfit,
            hairstyle: enrichedResult.hairstyle,
            accessories: enrichedResult.accessories,
            colorPalette: enrichedResult.colorPalette,
            whyItWorks: enrichedResult.whyItWorks,
            products: enrichedResult.products || []
        });

    } catch (error) {
        console.error('Analyse Error:', error);

        // Ensure cleanup on failure
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }

        // Return error response
        const status = error.message.includes('Invalid') ? 400 : 500;
        res.status(status).json({ error: error.message || 'Internal Server Error' });
    }
});

module.exports = router;
