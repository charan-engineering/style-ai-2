document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('style-form');
    const uploadSection = document.getElementById('upload-section');
    const processingSection = document.getElementById('processing-section');
    const resultsSection = document.getElementById('results-section');

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-upload');
    const submitBtn = document.getElementById('submit-btn');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');
    const dropContent = document.getElementById('drop-content');
    const errorMsg = document.getElementById('error-msg');

    let currentFile = null;

    // --- DRAG & DROP HANDLING ---

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('border-brand-500', 'bg-gray-800/50');
    }

    function unhighlight() {
        dropZone.classList.remove('border-brand-500', 'bg-gray-800/50');
    }

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);
    dropZone.addEventListener('click', (e) => {
        // Prevent clicking if the user is clicking the remove button or label itself
        if (e.target !== fileInput && e.target.closest('#remove-image') === null) {
            fileInput.click();
        }
    });

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const sizeMB = file.size / (1024 * 1024);

            if (sizeMB > 10) {
                showError('File is too large. Maximum size is 10MB.');
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showError('Invalid file type. Please upload a JPG, PNG, WEBP, or GIF.');
                return;
            }

            currentFile = file;
            showPreview(file);
            checkFormValidity();
            hideError();
        }
    }

    function showPreview(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            imagePreview.src = reader.result;
            imagePreview.classList.remove('hidden');
            removeImageBtn.classList.remove('hidden');
            dropContent.classList.add('opacity-0'); // Hide textual prompt
        }
    }

    removeImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
        dropContent.classList.remove('opacity-0');
        checkFormValidity();
    });

    // --- FORM VALIDATION ---
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    genderRadios.forEach(radio => {
        radio.addEventListener('change', checkFormValidity);
    });

    function checkFormValidity() {
        if (currentFile && document.querySelector('input[name="gender"]:checked')) {
            hideError();
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function hideError() {
        errorMsg.classList.add('hidden');
    }

    // --- FORM SUBMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentFile || !document.querySelector('input[name="gender"]:checked')) {
            showError("Please upload a photo and select your identity.");
            return;
        }

        hideError();

        // Transition to processing state
        uploadSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        processingSection.classList.add('slide-up-fade-in');

        // Dynamic Processing Text
        const texts = [
            "Analyzing facial structure and skin tone...",
            "Consulting Gemini 1.5 Pro stylist algorithms...",
            "Constructing tailored color palettes...",
            "Gathering shoppable products..."
        ];
        let textIndex = 0;
        const textInterval = setInterval(() => {
            textIndex = (textIndex + 1) % texts.length;
            document.getElementById('processing-text').textContent = texts[textIndex];
        }, 2000);

        try {
            const formData = new FormData();
            formData.append('image', currentFile);
            formData.append('gender', document.querySelector('input[name="gender"]:checked').value);

            const response = await fetch('/api/analyse', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            clearInterval(textInterval);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }

            renderResults(data);

            // Transition to results
            processingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            clearInterval(textInterval);
            uploadSection.classList.remove('hidden');
            processingSection.classList.add('hidden');
            showError(error.message);
        }
    });

    // --- RENDER RESULTS ---
    function renderResults(data) {
        // Build Swatch
        const [r, g, b] = data.skinTone.rgb;
        document.getElementById('skin-tone-swatch').style.backgroundColor = `rgb(${r},${g},${b})`;
        document.getElementById('skin-tone-category').textContent = data.skinTone.category;

        // Colors
        if (data.colorPalette) {
            document.getElementById('color-primary').style.backgroundColor = data.colorPalette.primary || '#333';
            document.getElementById('color-secondary').style.backgroundColor = data.colorPalette.secondary || '#666';
            document.getElementById('color-accent').style.backgroundColor = data.colorPalette.accent || '#999';
        }

        // Grooming
        if (data.hairstyle) {
            document.getElementById('hairstyle-name').textContent = data.hairstyle.name;
            document.getElementById('hairstyle-howto').textContent = data.hairstyle.howTo;
        }

        const accessoriesList = document.getElementById('accessories-list');
        accessoriesList.innerHTML = '';
        if (data.accessories && data.accessories.length > 0) {
            data.accessories.forEach(acc => {
                const el = document.createElement('span');
                el.className = "bg-gray-800 border border-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-full text-indigo-300";
                el.textContent = acc;
                accessoriesList.appendChild(el);
            });
        }

        // Outfit & Rationale
        document.getElementById('rationale-text').textContent = data.whyItWorks;

        const outfitGrid = document.getElementById('outfit-grid');
        outfitGrid.innerHTML = '';
        if (data.suggestedOutfit) {
            Object.entries(data.suggestedOutfit).forEach(([key, item]) => {
                const card = document.createElement('div');
                card.className = "bg-gray-800/50 p-4 border border-gray-700 rounded-xl space-y-1 hover:border-brand-500 hover:bg-gray-800 transition-colors";
                card.innerHTML = `
                    <p class="text-xs text-gray-400 capitalize font-medium uppercase tracking-wider">${key}</p>
                    <p class="text-lg font-bold text-white">${item.color} ${item.type}</p>
                    <p class="text-xs text-brand-400 font-medium">${item.brand || 'Suggested Brand'}</p>
                `;
                outfitGrid.appendChild(card);
            });
        }

        // Products Map
        const productsGrid = document.getElementById('products-grid');
        productsGrid.innerHTML = '';
        if (data.products && data.products.length > 0) {
            data.products.forEach(prod => {
                const card = document.createElement('a');
                card.href = prod.url;
                card.target = "_blank";
                card.className = "block group bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden shadow-lg hover:border-brand-500 transition-all hover:-translate-y-1";
                card.innerHTML = `
                    <div class="h-32 bg-gray-800 flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-brand-600/10 group-hover:bg-brand-600/20 transition-colors"></div>
                        <svg class="w-10 h-10 text-gray-600 group-hover:text-brand-400 transition-colors relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <div class="p-4 border-t border-gray-800">
                        <p class="text-sm font-bold text-white mb-1 group-hover:text-brand-400 transition-colors truncate">${prod.name}</p>
                        <p class="text-xs text-gray-500 flex justify-between items-center">
                            <span>${prod.provider || 'Shop Now'}</span>
                            <svg class="w-4 h-4 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </p>
                    </div>
                `;
                productsGrid.appendChild(card);
            });
        }
    }

    // --- RESET ---
    document.getElementById('reset-btn').addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        uploadSection.classList.add('slide-up-fade-in');

        removeImageBtn.click();
        form.reset();
        checkFormValidity();
        window.scrollTo(0, 0);
    });

});
