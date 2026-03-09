const sharp = require('sharp');

// Classify RGB into Fair, Medium, Olive, Deep
function classifySkinTone(r, g, b) {
    // Simple heuristic. Real version would use trained color classification or larger map
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

async function getSkinTone(filePath, buffer) {
    try {
        const image = sharp(buffer || filePath);
        const metadata = await image.metadata();

        const imgWidth = metadata.width;
        const imgHeight = metadata.height;

        // Sample a 50x50 region from the center of the image
        const sampleSize = 50;
        const left = Math.max(0, Math.floor(imgWidth / 2 - sampleSize / 2));
        const top = Math.max(0, Math.floor(imgHeight / 2 - sampleSize / 2));
        const width = Math.min(sampleSize, imgWidth - left);
        const height = Math.min(sampleSize, imgHeight - top);

        // Extract the center region and get raw pixel data (RGB)
        const { data } = await sharp(buffer || filePath)
            .extract({ left, top, width, height })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        let totalR = 0, totalG = 0, totalB = 0;
        const pixelCount = data.length / 3;

        for (let i = 0; i < data.length; i += 3) {
            totalR += data[i];
            totalG += data[i + 1];
            totalB += data[i + 2];
        }

        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);

        return classifySkinTone(avgR, avgG, avgB);

    } catch (error) {
        console.error('Skin tone detection error:', error);
        // Ultimate fallback if sharp fails
        return classifySkinTone(210, 180, 150); // Default to Fair/Medium
    }
}

module.exports = {
    getSkinTone,
    classifySkinTone
};
