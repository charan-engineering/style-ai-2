# StyleAI — AI Personal Fashion Consultant 🎩✨

StyleAI is a modern web application that uses advanced Multimodal AI to act as a personal fashion stylist. It analyzes your physical traits (skin tone, body type, facial features) and creates a tailored fashion profile just for you.

---

## 🚀 The Tech Stack

### Frontend (The Face)
- **HTML5 & CSS3**: Custom grid layouts and glassmorphism design.
- **Tailwind CSS**: Used for rapid, responsive utility styling.
- **Vanilla JavaScript**: Handles the interactive UI, file uploads, and rendering AI results without the overhead of heavy frameworks.
- **Google Fonts**: Uses 'Outfit' and 'Inter' for a premium, high-fashion aesthetic.

### Backend (The Brain)
- **Node.js & Express.js**: The core server handling API requests.
- **Google Gemini 2.0 Flash**: The state-of-the-art AI model that "sees" the uploaded photo and generates fashion logic.
- **Jimp**: A pure-JavaScript image processing library used to resize images and detect skin tones (chosen for 100% stability on cloud platforms).
- **Multer**: Handles the "Multipart" data transfer of image files from the browser to the server.

---

## ⚙️ How It Works (Step-by-Step)

### 1. The Input
The user uploads a photo and types in an optional "Occasion" (e.g., *"I'm going to a summer wedding"*). This extra text is used to "prime" the AI to give context-aware advice.

### 2. Image Optimization
The server doesn't send the raw, heavy image to the AI. Instead, it uses **Jimp** to:
- Resize the image to a standard width (800px).
- Detect the RGB values of the user's skin by sampling the center of the photo.
- Categorize the skin tone (Fair, Medium, Olive, or Deep).

### 3. The AI Consultation
The processed image and user text are sent to **Google Gemini**. We use a complex "System Prompt" that tells the AI to act as an elite stylist. Gemini returns a structured JSON object containing:
- **Seasonal Tone**: (e.g., Warm Autumn, Cool Winter).
- **Body Type**: (e.g., Athletic, Slim).
- **Color Palette**: 5 specific hex-code colors that harmonize with the user.
- **Outfit Suggestion**: Exact items (Shirt, Pants, Shoes) with brand recommendations.

### 4. Dynamic Recommendation
The app takes the AI's clothing suggestions and automatically generates **Google Shopping links**. Users can click any suggested item to find real products available for purchase.

### 5. Final Rendering
The frontend receives the data and uses CSS animations to reveal the results. It includes a "Click to Copy" hex code feature for the color palette, allowing users to save their personal colors easily.

---

## ☁️ Deployment
The project is optimized for **Vercel**. 
- It uses **Serverless Functions** (found in the `api/` folder).
- It follows a "Read-Only" architecture, meaning all image processing happens in the server's memory (RAM) rather than writing to a hard drive, ensuring fast and reliable performance in the cloud.

---

## 🛠️ Local Setup
1. Clone the repo.
2. Run `npm install`.
3. Create a `.env` file with your `GEMINI_API_KEY`.
4. Run `npm start` and visit `localhost:3000`.