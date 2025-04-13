
// Unicode symbol categories
const symbolCategories = {
    'Basic Latin': { range: [0x0020, 0x007F] },
    'Latin-1 Supplement': { range: [0x00A0, 0x00FF] },
    'Geometric Shapes': { range: [0x25A0, 0x25FF] },
    'Mathematical Operators': { range: [0x2200, 0x22FF] },
    'Box Drawing': { range: [0x2500, 0x257F] },
    'Block Elements': { range: [0x2580, 0x259F] },
    'Arrows': { range: [0x2190, 0x21FF] },
    'Dingbats': { range: [0x2700, 0x27BF] },
    'Emoji': { range: [0x1F600, 0x1F64F] },
    'Currency Symbols': { range: [0x20A0, 0x20CF] }
};

// Unicode name database (limited to a few examples for this demo)
const unicodeNames = {
    0x25B2: "BLACK UP-POINTING TRIANGLE",
    0x25BC: "BLACK DOWN-POINTING TRIANGLE",
    0x25C6: "BLACK DIAMOND",
    0x25A0: "BLACK SQUARE",
    0x25CF: "BLACK CIRCLE",
    0x2665: "BLACK HEART SUIT"
    // In a full implementation, this would include many more symbols
};

// DOM elements
const symbolGrid = document.getElementById('symbolGrid');
const unicodeNameEl = document.getElementById('unicodeName');
const charCodeEl = document.getElementById('charCode');
const recentSymbols = document.getElementById('recentSymbols');
const subsetSelect = document.getElementById('subsetSelect');
const fontSelect = document.getElementById('fontSelect');
const searchBox = document.getElementById('searchBox');
const insertBtn = document.getElementById('insertBtn');
const closeBtn = document.getElementById('closeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const symbolsTab = document.getElementById('symbolsTab');
const specialCharTab = document.getElementById('specialCharTab');
const symbolsPanel = document.getElementById('symbolsPanel');
const specialCharPanel = document.getElementById('specialCharPanel');
const codeFormat = document.getElementById('codeFormat');

// State
let selectedSymbol = null;
let recentSymbolsList = [];
let currentSearchResults = [];
let isSearchActive = false;

// Initialize the grid with symbols
function loadSymbolsForCategory(categoryName) {
    symbolGrid.innerHTML = '';
    isSearchActive = false;

    const category = symbolCategories[categoryName];
    if (!category) return;

    const [start, end] = category.range;

    for (let codePoint = start; codePoint <= end; codePoint++) {
        try {
            const char = String.fromCodePoint(codePoint);
            addSymbolToGrid(char, codePoint);
        } catch (e) {
            console.warn(`Couldn't display character at code point ${codePoint.toString(16)}`);
        }
    }
}

// Add a symbol to the grid
function addSymbolToGrid(char, codePoint) {
    const cell = document.createElement('div');
    cell.className = 'symbol-cell';
    cell.textContent = char;
    cell.tabIndex = 0; // Make focusable for accessibility
    cell.dataset.codePoint = codePoint;

    cell.addEventListener('click', () => selectSymbol(cell, char, codePoint));
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            selectSymbol(cell, char, codePoint);
            e.preventDefault();
        }
    });

    symbolGrid.appendChild(cell);
}

// Select a symbol
function selectSymbol(cell, char, codePoint) {
    // Clear previous selection
    const prevSelected = document.querySelector('.symbol-cell.selected');
    if (prevSelected) prevSelected.classList.remove('selected');

    // Highlight new selection
    cell.classList.add('selected');
    selectedSymbol = { char, codePoint };

    // Update info
    updateSymbolInfo(char, codePoint);
}

// Update symbol information
function updateSymbolInfo(char, codePoint) {
    // Set the unicode name
    const name = unicodeNames[codePoint] || `Character U+${codePoint.toString(16).toUpperCase()}`;
    unicodeNameEl.textContent = `Unicode name: ${name}`;

    // Set the character code
    if (codeFormat.value === 'hex') {
        charCodeEl.value = codePoint.toString(16).toUpperCase();
    } else {
        charCodeEl.value = codePoint.toString(10);
    }
}

// Add a symbol to recent symbols
function addToRecentSymbols(char, codePoint) {
    // Check if already in recent list
    const existingIndex = recentSymbolsList.findIndex(item => item.codePoint === codePoint);
    if (existingIndex !== -1) {
        // Remove from current position
        recentSymbolsList.splice(existingIndex, 1);
    }

    // Add to the start of the list
    recentSymbolsList.unshift({ char, codePoint });

    // Keep only the most recent 16 symbols
    if (recentSymbolsList.length > 16) {
        recentSymbolsList.pop();
    }

    // Update the recent symbols display
    updateRecentSymbolsDisplay();
}

// Update the recent symbols display
function updateRecentSymbolsDisplay() {
    recentSymbols.innerHTML = '';

    recentSymbolsList.forEach(({ char, codePoint }) => {
        const recentSymbol = document.createElement('div');
        recentSymbol.className = 'recent-symbol';
        recentSymbol.textContent = char;
        recentSymbol.tabIndex = 0;
        recentSymbol.dataset.codePoint = codePoint;

        recentSymbol.addEventListener('click', () => {
            selectSymbolByCodePoint(codePoint);
        });

        recentSymbols.appendChild(recentSymbol);
    });
}

// Select a symbol by its code point
function selectSymbolByCodePoint(codePoint) {
    // Find the symbol in the grid
    const symbolCell = document.querySelector(`.symbol-cell[data-code-point="${codePoint}"]`);

    if (symbolCell) {
        const char = String.fromCodePoint(codePoint);
        selectSymbol(symbolCell, char, codePoint);
        symbolCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Symbol isn't currently in the grid (might be from another category)
        // Just update the info
        const char = String.fromCodePoint(codePoint);
        selectedSymbol = { char, codePoint };
        updateSymbolInfo(char, codePoint);
    }
}

// Insert the selected symbol
function insertSymbol() {
    if (!selectedSymbol) return;

    // In a real application, this would insert the symbol into an active document
    // For this demo, we'll copy it to clipboard and show an alert
    navigator.clipboard.writeText(selectedSymbol.char).then(() => {
        alert(`Symbol "${selectedSymbol.char}" copied to clipboard!`);

        // Add to recent symbols
        addToRecentSymbols(selectedSymbol.char, selectedSymbol.codePoint);
    });
}

// Search for symbols
function searchSymbols(query) {
    if (!query.trim()) {
        // If search is empty, show the selected category
        isSearchActive = false;
        loadSymbolsForCategory(subsetSelect.value);
        return;
    }

    isSearchActive = true;
    symbolGrid.innerHTML = '';
    currentSearchResults = [];

    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();

    // Search through all categories
    Object.entries(symbolCategories).forEach(([category, { range }]) => {
        const [start, end] = range;

        for (let codePoint = start; codePoint <= end; codePoint++) {
            try {
                const char = String.fromCodePoint(codePoint);
                const name = (unicodeNames[codePoint] || '').toLowerCase();
                const hexCode = codePoint.toString(16).toLowerCase();

                // Match if character, name or code contains the query
                if (char.toLowerCase().includes(lowerQuery) ||
                    name.includes(lowerQuery) ||
                    hexCode.includes(lowerQuery)) {

                    currentSearchResults.push({ char, codePoint });
                    addSymbolToGrid(char, codePoint);
                }
            } catch (e) {
                // Skip problematic characters
            }
        }
    });
}

// Event listeners
subsetSelect.addEventListener('change', () => {
    if (!isSearchActive) {
        loadSymbolsForCategory(subsetSelect.value);
    }
});

fontSelect.addEventListener('change', () => {
    symbolGrid.style.fontFamily = fontSelect.value;
});

searchBox.addEventListener('input', () => {
    searchSymbols(searchBox.value);
});

insertBtn.addEventListener('click', insertSymbol);

closeBtn.addEventListener('click', () => {
    // In a real application, this would close the dialog
    alert('Dialog would close here.');
});

cancelBtn.addEventListener('click', () => {
    // In a real application, this would close the dialog
    alert('Dialog would close here.');
});

// Tab switching
symbolsTab.addEventListener('click', () => {
    symbolsTab.classList.add('active');
    specialCharTab.classList.remove('active');
    symbolsPanel.classList.remove('hidden');
    specialCharPanel.classList.add('hidden');
});

specialCharTab.addEventListener('click', () => {
    specialCharTab.classList.add('active');
    symbolsTab.classList.remove('active');
    specialCharPanel.classList.remove('hidden');
    symbolsPanel.classList.add('hidden');
});

// Handle character code input
charCodeEl.addEventListener('change', () => {
    try {
        let codePoint;
        if (codeFormat.value === 'hex') {
            codePoint = parseInt(charCodeEl.value, 16);
        } else {
            codePoint = parseInt(charCodeEl.value, 10);
        }

        if (!isNaN(codePoint)) {
            const char = String.fromCodePoint(codePoint);
            selectedSymbol = { char, codePoint };
            updateSymbolInfo(char, codePoint);
        }
    } catch (e) {
        alert('Invalid character code');
    }
});

codeFormat.addEventListener('change', () => {
    if (selectedSymbol) {
        // Update the display format
        if (codeFormat.value === 'hex') {
            charCodeEl.value = selectedSymbol.codePoint.toString(16).toUpperCase();
        } else {
            charCodeEl.value = selectedSymbol.codePoint.toString(10);
        }
    }
});

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    // Load the selected category
    loadSymbolsForCategory('Geometric Shapes');

    // Set the font
    symbolGrid.style.fontFamily = fontSelect.value;

    // Select the triangle symbol as default (just like in the example image)
    setTimeout(() => {
        const triangleCodePoint = 0x25B2; // Black Up-Pointing Triangle
        selectSymbolByCodePoint(triangleCodePoint);
    }, 100);
});