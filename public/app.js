// State management
const state = {
    mode: 'single',
    files: [],
    inputFormat: '',
    outputFormat: '',
    options: {}
};

// DOM elements
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    batchFileInput: document.getElementById('batchFileInput'),
    fileList: document.getElementById('fileList'),
    inputFormat: document.getElementById('inputFormat'),
    outputFormat: document.getElementById('outputFormat'),
    convertBtn: document.getElementById('convertBtn'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    resultSection: document.getElementById('resultSection'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    pandocStatus: document.getElementById('pandocStatus')
};

// Initialize app
async function init() {
    await checkPandoc();
    await loadFormats();
    setupEventListeners();
    updateConvertButton();
}

// Check if Pandoc is available
async function checkPandoc() {
    try {
        const response = await fetch('/api/check-pandoc');
        const data = await response.json();

        if (data.available) {
            elements.pandocStatus.textContent = `✓ ${data.version}`;
            elements.pandocStatus.style.background = 'rgba(39, 174, 96, 0.3)';
        } else {
            elements.pandocStatus.textContent = '⚠ Pandoc not installed';
            elements.pandocStatus.style.background = 'rgba(231, 76, 60, 0.3)';
            showError('Pandoc is not installed. Please install it from https://pandoc.org/installing.html');
        }
    } catch (error) {
        elements.pandocStatus.textContent = '⚠ Connection error';
        elements.pandocStatus.style.background = 'rgba(231, 76, 60, 0.3)';
    }
}

// Load available formats
async function loadFormats() {
    try {
        const response = await fetch('/api/formats');
        const formats = await response.json();

        // Populate input format
        formats.input.forEach(format => {
            const option = document.createElement('option');
            option.value = format.value;
            option.textContent = format.label;
            elements.inputFormat.appendChild(option);
        });

        // Populate output format
        formats.output.forEach(format => {
            const option = document.createElement('option');
            option.value = format.value;
            option.textContent = format.label;
            elements.outputFormat.appendChild(option);
        });

        // Set default output format to HTML
        elements.outputFormat.value = 'html';
        state.outputFormat = 'html';

    } catch (error) {
        console.error('Error loading formats:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            clearFiles();
        });
    });

    // Upload area click
    elements.uploadArea.addEventListener('click', () => {
        if (state.mode === 'single') {
            elements.fileInput.click();
        } else {
            elements.batchFileInput.click();
        }
    });

    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (state.mode === 'single' && files.length > 0) {
            handleFiles([files[0]]);
        } else {
            handleFiles(files);
        }
    });

    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    elements.batchFileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    // Format selection
    elements.inputFormat.addEventListener('change', (e) => {
        state.inputFormat = e.target.value;
        updateConvertButton();
    });

    elements.outputFormat.addEventListener('change', (e) => {
        state.outputFormat = e.target.value;
        updateConvertButton();
    });

    // Options
    document.querySelectorAll('.option-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateOptions();
        });
    });

    // Convert button
    elements.convertBtn.addEventListener('click', convertFiles);
}

// Handle file selection
function handleFiles(files) {
    if (state.mode === 'single') {
        state.files = files.slice(0, 1);
    } else {
        state.files = [...state.files, ...files];
    }

    displayFiles();
    updateConvertButton();
}

// Display selected files
function displayFiles() {
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '';
        return;
    }

    elements.fileList.innerHTML = state.files.map((file, index) => `
        <div class="file-item">
            <div class="file-name">
                <span>📄</span>
                <span>${file.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button class="file-remove" onclick="removeFile(${index})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Remove file
function removeFile(index) {
    state.files.splice(index, 1);
    displayFiles();
    updateConvertButton();
}

// Clear all files
function clearFiles() {
    state.files = [];
    elements.fileInput.value = '';
    elements.batchFileInput.value = '';
    displayFiles();
    updateConvertButton();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Update options state
function updateOptions() {
    state.options = {
        toc: document.getElementById('optToc').checked,
        numberSections: document.getElementById('optNumberSections').checked,
        bibliography: document.getElementById('optBibliography').checked,
        css: document.getElementById('optCss').checked
    };
}

// Update convert button state
function updateConvertButton() {
    const canConvert = state.files.length > 0 && state.outputFormat;
    elements.convertBtn.disabled = !canConvert;
}

// Toggle section
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const title = section.previousElementSibling;

    section.classList.toggle('collapsed');
    title.querySelector('.toggle-icon').style.transform =
        section.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
}

// Convert files
async function convertFiles() {
    hideMessages();
    updateOptions();

    // Show progress
    elements.progressSection.classList.remove('hidden');
    elements.progressFill.style.width = '50%';
    elements.convertBtn.disabled = true;

    try {
        if (state.mode === 'single') {
            await convertSingleFile();
        } else {
            await convertBatchFiles();
        }

        // Show success
        elements.progressSection.classList.add('hidden');
        elements.resultSection.classList.remove('hidden');

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            elements.resultSection.classList.add('hidden');
        }, 5000);

    } catch (error) {
        console.error('Conversion error:', error);
        elements.progressSection.classList.add('hidden');
        showError(error.message || 'Conversion failed. Please try again.');
    } finally {
        elements.convertBtn.disabled = false;
        elements.progressFill.style.width = '0%';
    }
}

// Convert single file
async function convertSingleFile() {
    const formData = new FormData();
    formData.append('file', state.files[0]);
    formData.append('fromFormat', state.inputFormat || 'markdown');
    formData.append('toFormat', state.outputFormat);
    formData.append('options', JSON.stringify(state.options));

    const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Conversion failed');
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getOutputFilename(state.files[0].name);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Convert batch files
async function convertBatchFiles() {
    const formData = new FormData();

    state.files.forEach(file => {
        formData.append('files', file);
    });

    formData.append('fromFormat', state.inputFormat || 'markdown');
    formData.append('toFormat', state.outputFormat);
    formData.append('options', JSON.stringify(state.options));

    const response = await fetch('/api/convert-batch', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch conversion failed');
    }

    // Download ZIP file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-documents.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Get output filename
function getOutputFilename(inputFilename) {
    const basename = inputFilename.substring(0, inputFilename.lastIndexOf('.')) || inputFilename;
    const extensions = {
        markdown: '.md',
        html: '.html',
        docx: '.docx',
        odt: '.odt',
        epub: '.epub',
        pdf: '.pdf',
        latex: '.tex',
        rst: '.rst',
        textile: '.textile',
        org: '.org',
        mediawiki: '.wiki',
        rtf: '.rtf',
        plain: '.txt',
        json: '.json'
    };
    return basename + (extensions[state.outputFormat] || '.txt');
}

// Show error message
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.classList.remove('hidden');

    // Auto-hide after 10 seconds
    setTimeout(() => {
        elements.errorSection.classList.add('hidden');
    }, 10000);
}

// Hide all messages
function hideMessages() {
    elements.resultSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
}

// Make functions globally accessible
window.toggleSection = toggleSection;
window.removeFile = removeFile;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
