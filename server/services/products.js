// Real implementations would hit affiliate APIs (e.g. ShopStyle Collective)

function generateMockLink(itemQuery) {
    const q = encodeURIComponent(itemQuery || 'wardrobe');
    
    // Sometimes the brand can be specific, but a general Google Shopping link
    // is the most reliable way to guarantee the user finds *something* matching the AI's suggestion.
    return `https://www.google.com/search?tbm=shop&q=${q}`;
}

async function appendProducts(geminiResult, gender, skinTone) {
    const products = [];
    const outfit = geminiResult.suggestedOutfit;

    if (outfit) {
        if (outfit.shirt) {
            products.push({
                name: `${outfit.shirt.color} ${outfit.shirt.type}`,
                url: generateMockLink(`${gender} ${outfit.shirt.brand || ''} ${outfit.shirt.color} ${outfit.shirt.type}`),
                provider: 'Google Shopping'
            });
        }
        if (outfit.pants) {
            products.push({
                name: `${outfit.pants.color} ${outfit.pants.type}`,
                url: generateMockLink(`${gender} ${outfit.pants.brand || ''} ${outfit.pants.color} ${outfit.pants.type}`),
                provider: 'Google Shopping'
            });
        }
        if (outfit.shoes) {
            products.push({
                name: `${outfit.shoes.color} ${outfit.shoes.type}`,
                url: generateMockLink(`${gender} ${outfit.shoes.brand || ''} ${outfit.shoes.color} ${outfit.shoes.type}`),
                provider: 'Google Shopping'
            });
        }
    }

    geminiResult.products = products;
    return geminiResult;
}

module.exports = {
    appendProducts
};
