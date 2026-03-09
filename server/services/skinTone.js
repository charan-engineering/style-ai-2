const Jimp = require('jimp');

// Classify RGB into Fair, Medium, Olive, Deep
function classifySkinTone(r, g, b) {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    let category = 'Medium';
    if (luminance > 180) {
        category = 'Fair';
    } else if (luminance > 120 && luminance <= 180) {
        if (r > g + 40 && g > b + 20) {
            category = 'Medium';
        } else {
            category = 'Olive';
        }
    } else {
        category = 'Deep';
    }

    return { category, rgb: [r, g, b] };
}

async function getSkinTone(buffer) {
    try {
        const image = await Jimp.read(buffer);
        
        const imgWidth = image.bitmap.width;
        const imgHeight = image.bitmap.height;

        // Sample a 50x50 region from the center
        const sampleSize = Math.min(50, imgWidth, imgHeight);
        const left = Math.floor(imgWidth / 2 - sampleSize / 2);
        const top = Math.floor(imgHeight / 2 - sampleSize / 2);

        // Crop to the center region
        image.crop(left, top, sampleSize, sampleSize);

        let totalR = 0, totalG = 0, totalB = 0;
        const pixelCount = image.bitmap.data.length / 4; // Jimp data is RGBA

        for (let i = 0; i < image.bitmap.data.length; i += 4) {
            totalR += image.bitmap.data[i];
            totalG += image.bitmap.data[i + 1];
            totalB += image.bitmap.data[i + 2];
        }

        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);

        return classifySkinTone(avgR, avgG, avgB);

    } catch (error) {
        console.error('Skin tone detection error:', error);
        return classifySkinTone(210, 180, 150);
    }
}

module.exports = {
    getSkinTone,
    classifySkinTone
};
