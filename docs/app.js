const STORAGE_KEY = 'ingredients-frais';

const DEFAULT_DATA = {
    "Légumes": [
        "ail", "aubergine", "brocoli", "carottes", "céleri", "céleri-rave",
        "chou kale", "choux de Bruxelles", "concombres", "courges",
        "courges butternut", "daïkons", "échalotes françaises",
        "échalotes vertes", "épinards", "navets", "oignons rouges",
        "poireaux", "poivrons verts", "radicchio", "zucchini"
    ],
    "Fruits": [
        "ananas", "avocats", "bananes", "bleuets", "citrons",
        "framboises", "pommes", "tomates cerises"
    ],
    "Herbes fraîches": [
        "aneth", "basilic", "ciboulette", "coriandre", "menthe",
        "persil", "romarin frais", "thym frais"
    ],
    "Produits laitiers frais": [
        "beurre", "cheddar", "comté", "crème 35%", "emmental",
        "lait", "parmesan", "yogourt nature"
    ],
    "Protéines fraîches": [
        "oeufs", "tempeh", "tofu"
    ]
};

let data = null; // { categories: { "Légumes": [{nom, actif},...], ... } }

function init() {
    loadData();
    render();
    setupEventListeners();
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            data = JSON.parse(saved);
            return;
        } catch (e) {
            console.error('Données corrompues, réinitialisation');
        }
    }
    // First launch: build from defaults (all inactive)
    data = { categories: {} };
    for (const [cat, items] of Object.entries(DEFAULT_DATA)) {
        data.categories[cat] = items.map(nom => ({ nom, actif: false }));
    }
    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function render() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    let totalActive = 0;
    let total = 0;

    for (const [categoryName, ingredients] of Object.entries(data.categories)) {
        const activeCount = ingredients.filter(i => i.actif).length;
        totalActive += activeCount;
        total += ingredients.length;

        const section = document.createElement('section');
        section.className = 'category';
        section.innerHTML = `
            <div class="category-header">
                <span>${categoryName}</span>
                <span class="category-count">${activeCount} / ${ingredients.length}</span>
            </div>
            <div class="category-items">
                ${ingredients.map(ing => `
                    <div class="ingredient ${ing.actif ? '' : 'inactive'}" data-name="${ing.nom}" data-category="${categoryName}">
                        <input type="checkbox" ${ing.actif ? 'checked' : ''}>
                        <span class="ingredient-name">${ing.nom}</span>
                        <button class="ingredient-delete" title="Supprimer">&times;</button>
                    </div>
                `).join('')}
            </div>
            <div class="add-ingredient-row">
                <input type="text" placeholder="Ajouter..." data-category="${categoryName}">
                <button data-add-category="${categoryName}">+</button>
            </div>
        `;
        container.appendChild(section);
    }

    document.getElementById('stats').textContent = `${totalActive} ingrédient${totalActive > 1 ? 's' : ''} en stock sur ${total}`;

    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = totalActive === 0;
}

function setupEventListeners() {
    const container = document.getElementById('categories-container');

    // Toggle ingredient
    container.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const row = e.target.closest('.ingredient');
            const name = row.dataset.name;
            const cat = row.dataset.category;
            const isActive = e.target.checked;

            const ingredient = data.categories[cat].find(i => i.nom === name);
            if (ingredient) {
                ingredient.actif = isActive;
                row.classList.toggle('inactive', !isActive);
                saveData();
                render();
            }
        }
    });

    // Delete ingredient
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('ingredient-delete')) {
            const row = e.target.closest('.ingredient');
            const name = row.dataset.name;
            const cat = row.dataset.category;

            if (confirm(`Supprimer « ${name} » ?`)) {
                data.categories[cat] = data.categories[cat].filter(i => i.nom !== name);
                saveData();
                render();
                showToast(`« ${name} » supprimé`);
            }
        }
    });

    // Add ingredient (button click)
    container.addEventListener('click', (e) => {
        const addCat = e.target.dataset.addCategory;
        if (addCat) {
            const input = container.querySelector(`input[data-category="${addCat}"]`);
            addIngredient(addCat, input);
        }
    });

    // Add ingredient (Enter key)
    container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.dataset.category) {
            addIngredient(e.target.dataset.category, e.target);
        }
    });

    // Generate prompt
    document.getElementById('generate-btn').addEventListener('click', generatePrompt);

    // Copy prompt
    document.getElementById('copy-btn').addEventListener('click', copyPrompt);

    // Close modal
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('prompt-modal').addEventListener('click', (e) => {
        if (e.target.id === 'prompt-modal') closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function addIngredient(categoryName, inputEl) {
    const name = inputEl.value.trim();
    if (!name) return;

    const exists = data.categories[categoryName].some(
        i => i.nom.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
        showToast('Cet ingrédient existe déjà');
        return;
    }

    data.categories[categoryName].push({ nom: name, actif: true });
    data.categories[categoryName].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    saveData();
    render();
    showToast(`« ${name} » ajouté`);
}

function generatePrompt() {
    const lines = [];

    for (const [cat, ingredients] of Object.entries(data.categories)) {
        const active = ingredients.filter(i => i.actif).map(i => i.nom);
        if (active.length > 0) {
            lines.push(`${cat} : ${active.join(', ')}`);
        }
    }

    if (lines.length === 0) return;

    const prompt = `Propose-moi une recette végétarienne en utilisant au moins quelques-uns de ces ingrédients frais que j'ai sous la main (pas besoin de tous les utiliser) :\n\n${lines.join('\n')}\n\nJ'ai aussi les ingrédients de base du garde-manger (pâtes, riz, huile, épices courantes, etc.).`;

    document.getElementById('prompt-text').textContent = prompt;
    document.getElementById('prompt-modal').classList.remove('hidden');
}

async function copyPrompt() {
    const text = document.getElementById('prompt-text').textContent;
    try {
        await navigator.clipboard.writeText(text);
        showToast('Prompt copié !');
        closeModal();
    } catch {
        // Fallback for older browsers / non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Prompt copié !');
        closeModal();
    }
}

function closeModal() {
    document.getElementById('prompt-modal').classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast._timeout);
    showToast._timeout = setTimeout(() => toast.classList.add('hidden'), 2500);
}

init();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
