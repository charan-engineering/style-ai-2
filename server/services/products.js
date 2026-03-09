// Mock static product database based on items in the Gemini JSON
// Real implementations would hit affiliate APIs (e.g. ShopStyle Collective)

const partnerRetailers = [
    { domain: 'asos.com', name: 'ASOS' },
    { domain: 'zara.com', name: 'Zara' },
    { domain: 'hm.com', name: 'H&M' },
    { domain: 'mrporter.com', name: 'Mr Porter' }
];

function generateMockLink(itemQuery) {
    const retailer = partnerRetailers[Math.floor(Math.random() * partnerRetailers.length)];
    const q = encodeURIComponent(itemQuery || 'wardrobe');
    return `https://${retailer.domain}/search/?q=${q}`;
}

async function appendProducts(geminiResult, gender, skinTone) {
    const products = [];
    const outfit = geminiResult.suggestedOutfit;

    if (outfit) {
        if (outfit.shirt) {
            products.push({
                name: `${outfit.shirt.color} ${outfit.shirt.type}`,
                url: generateMockLink(`${outfit.shirt.brand || ''} ${outfit.shirt.color} ${outfit.shirt.type}`),
                provider: 'Affiliate'
            });
        }
        if (outfit.pants) {
            products.push({
                name: `${outfit.pants.color} ${outfit.pants.type}`,
                url: generateMockLink(`${outfit.pants.brand || ''} ${outfit.pants.color} ${outfit.pants.type}`),
                provider: 'Affiliate'
            });
        }
        if (outfit.shoes) {
            products.push({
                name: `${outfit.shoes.color} ${outfit.shoes.type}`,
                url: generateMockLink(`${outfit.shoes.brand || ''} ${outfit.shoes.color} ${outfit.shoes.type}`),
                provider: 'Affiliate'
            });
        }
    }

    geminiResult.products = products;
    return geminiResult;
}

module.exports = {
    appendProducts
};
