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
    ],
    "Autres": []
};

const state = {
    data: null,
    collapsed: new Set(),
    query: '',
    confirmDel: null,
    longPressFired: false,
};

function init() {
    loadData();
    render();
    setupEventListeners();
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state.data = JSON.parse(saved);
            for (const [cat, items] of Object.entries(DEFAULT_DATA)) {
                if (!state.data.categories[cat]) {
                    state.data.categories[cat] = items.map(nom => ({ nom, actif: false }));
                }
            }
            saveData();
            return;
        } catch (e) {
            console.error('Données corrompues, réinitialisation');
        }
    }
    state.data = { categories: {} };
    for (const [cat, items] of Object.entries(DEFAULT_DATA)) {
        state.data.categories[cat] = items.map(nom => ({ nom, actif: false }));
    }
    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function normalizeText(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getStats() {
    let active = 0, total = 0;
    for (const items of Object.values(state.data.categories)) {
        active += items.filter(i => i.actif).length;
        total += items.length;
    }
    return { active, total };
}

function getFilteredCategories() {
    const q = state.query.trim().toLowerCase();
    if (!q) {
        return { categories: state.data.categories, matchCount: getStats().total, isFiltering: false };
    }
    const nq = normalizeText(q);
    const cats = {};
    let matchCount = 0;
    for (const [cat, items] of Object.entries(state.data.categories)) {
        const hits = items.filter(i => normalizeText(i.nom).includes(nq));
        cats[cat] = hits;
        matchCount += hits.length;
    }
    return { categories: cats, matchCount, isFiltering: true };
}

function render() {
    const stats = getStats();
    const filtered = getFilteredCategories();

    document.getElementById('active-count').textContent = stats.active;

    const pct = stats.total ? (stats.active / stats.total) * 100 : 0;
    document.getElementById('progress-fill').style.width = pct + '%';

    const searchBar = document.getElementById('search-bar');
    const searchClear = document.getElementById('search-clear');
    const searchMeta = document.getElementById('search-meta');
    if (state.query) {
        searchBar.classList.add('has-query');
        searchClear.classList.remove('hidden');
        searchMeta.classList.remove('hidden');
        searchMeta.textContent = `${filtered.matchCount} résultat${filtered.matchCount > 1 ? 's' : ''}`;
    } else {
        searchBar.classList.remove('has-query');
        searchClear.classList.add('hidden');
        searchMeta.classList.add('hidden');
    }

    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    if (filtered.isFiltering && filtered.matchCount === 0) {
        const empty = document.createElement('div');
        empty.className = 'b-empty';
        empty.innerHTML = `
            <div class="b-empty-1">Aucun ingrédient</div>
            <div class="b-empty-2">ne correspond à «&nbsp;${escapeHtml(state.query)}&nbsp;»</div>
        `;
        container.appendChild(empty);
    }

    for (const [cat, items] of Object.entries(filtered.categories)) {
        if (filtered.isFiltering && items.length === 0) continue;
        const isCol = state.collapsed.has(cat) && !filtered.isFiltering;
        const fullList = state.data.categories[cat] || [];
        const activeCount = fullList.filter(i => i.actif).length;
        const headerCount = filtered.isFiltering ? items.length : activeCount;

        const section = document.createElement('section');
        section.className = `b-cat ${isCol ? 'is-col' : ''}`;
        section.innerHTML = `
            <button class="b-cat-hd" data-toggle-cat="${escapeHtml(cat)}">
                <span class="b-cat-name">${escapeHtml(cat)}</span>
                <span class="b-cat-meta">
                    <span class="b-cat-count">${headerCount}<span class="b-cat-of">/${fullList.length}</span></span>
                    <span class="b-cat-chev">${isCol ? '▸' : '▾'}</span>
                </span>
            </button>
            ${!isCol ? `
                <div class="b-chips">
                    ${items.map(ing => `
                        <button class="b-chip ${ing.actif ? 'on' : ''}"
                                data-cat="${escapeHtml(cat)}"
                                data-nom="${escapeHtml(ing.nom)}">
                            <span class="b-chip-dot"></span>
                            <span class="b-chip-lbl">${escapeHtml(ing.nom)}</span>
                        </button>
                    `).join('')}
                    ${!filtered.isFiltering ? `
                        <div class="b-chip-add">
                            <input type="text" placeholder="+ ajouter"
                                   data-add-cat="${escapeHtml(cat)}"
                                   autocomplete="off" autocorrect="off"
                                   autocapitalize="off" spellcheck="false">
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
        container.appendChild(section);
    }

    const footerStats = document.getElementById('footer-stats');
    const remaining = stats.total - stats.active;
    footerStats.innerHTML = `
        <div><b>${stats.active}</b> coché${stats.active > 1 ? 's' : ''}</div>
        <div class="b-footer-dot">·</div>
        <div>${remaining} restant${remaining > 1 ? 's' : ''}</div>
    `;

    document.getElementById('generate-btn').disabled = stats.active === 0;
}

function toggleIngredient(cat, nom) {
    const list = state.data.categories[cat];
    if (!list) return;
    const item = list.find(i => i.nom === nom);
    if (!item) return;
    item.actif = !item.actif;
    saveData();
    render();
}

function deleteIngredient(cat, nom) {
    state.data.categories[cat] = (state.data.categories[cat] || []).filter(i => i.nom !== nom);
    saveData();
    render();
}

function addIngredient(cat, nom) {
    const trimmed = nom.trim();
    if (!trimmed) return false;
    const list = state.data.categories[cat] || [];
    if (list.some(i => i.nom.toLowerCase() === trimmed.toLowerCase())) return false;
    list.push({ nom: trimmed, actif: true });
    list.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    state.data.categories[cat] = list;
    saveData();
    render();
    // Restore focus to the same category's add input after re-render
    requestAnimationFrame(() => {
        const inputs = document.querySelectorAll('input[data-add-cat]');
        for (const i of inputs) {
            if (i.dataset.addCat === cat) { i.focus(); break; }
        }
    });
    return true;
}

function toggleCollapse(cat) {
    if (state.collapsed.has(cat)) state.collapsed.delete(cat);
    else state.collapsed.add(cat);
    render();
}

function openConfirm(cat, nom) {
    state.confirmDel = { cat, nom };
    document.getElementById('confirm-name').textContent = `« ${nom} »`;
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirm() {
    state.confirmDel = null;
    document.getElementById('confirm-modal').classList.add('hidden');
    setTimeout(() => { state.longPressFired = false; }, 200);
}

function buildPrompt() {
    const lines = [];
    for (const [cat, items] of Object.entries(state.data.categories)) {
        const active = items.filter(i => i.actif).map(i => i.nom);
        if (active.length > 0) lines.push(`${cat} : ${active.join(', ')}`);
    }
    if (lines.length === 0) return '';
    return `Propose-moi 5 recettes végétariennes en utilisant au moins quelques-uns de ces ingrédients frais que j'ai sous la main (pas besoin de tous les utiliser) :\n\n${lines.join('\n')}\n\nJ'ai aussi les ingrédients de base du garde-manger (pâtes, riz, huile, épices courantes, etc.).`;
}

function openPromptModal() {
    const prompt = buildPrompt();
    if (!prompt) return;
    document.getElementById('prompt-text').textContent = prompt;
    document.getElementById('prompt-modal').classList.remove('hidden');
}

function closePromptModal() {
    document.getElementById('prompt-modal').classList.add('hidden');
    const btn = document.getElementById('copy-btn');
    btn.classList.remove('is-copied');
    btn.textContent = 'Copier le prompt';
}

async function copyPrompt() {
    const text = document.getElementById('prompt-text').textContent;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✓ Copié !';
    btn.classList.add('is-copied');
    setTimeout(() => {
        btn.textContent = 'Copier le prompt';
        btn.classList.remove('is-copied');
    }, 1800);
}

function setupEventListeners() {
    const container = document.getElementById('categories-container');

    let pressTimer = null;

    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    container.addEventListener('touchstart', (e) => {
        const chip = e.target.closest('.b-chip');
        if (!chip) return;
        cancelPress();
        const cat = chip.dataset.cat;
        const nom = chip.dataset.nom;
        pressTimer = setTimeout(() => {
            pressTimer = null;
            state.longPressFired = true;
            openConfirm(cat, nom);
        }, 500);
    }, { passive: true });
    container.addEventListener('touchend', cancelPress, { passive: true });
    container.addEventListener('touchmove', cancelPress, { passive: true });
    container.addEventListener('touchcancel', cancelPress, { passive: true });

    container.addEventListener('contextmenu', (e) => {
        const chip = e.target.closest('.b-chip');
        if (!chip) return;
        e.preventDefault();
        openConfirm(chip.dataset.cat, chip.dataset.nom);
    });

    container.addEventListener('click', (e) => {
        if (state.longPressFired) {
            state.longPressFired = false;
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const chip = e.target.closest('.b-chip');
        if (chip) {
            toggleIngredient(chip.dataset.cat, chip.dataset.nom);
            return;
        }
        const headerBtn = e.target.closest('[data-toggle-cat]');
        if (headerBtn) {
            toggleCollapse(headerBtn.dataset.toggleCat);
            return;
        }
    });

    container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const cat = e.target.dataset && e.target.dataset.addCat;
        if (!cat) return;
        addIngredient(cat, e.target.value);
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        state.query = e.target.value;
        render();
    });
    document.getElementById('search-clear').addEventListener('click', () => {
        state.query = '';
        searchInput.value = '';
        searchInput.focus();
        render();
    });

    document.getElementById('generate-btn').addEventListener('click', openPromptModal);
    document.getElementById('copy-btn').addEventListener('click', copyPrompt);
    document.getElementById('close-modal-btn').addEventListener('click', closePromptModal);
    document.getElementById('prompt-modal').addEventListener('click', (e) => {
        if (e.target.id === 'prompt-modal') closePromptModal();
    });

    document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
    document.getElementById('confirm-ok').addEventListener('click', () => {
        if (state.confirmDel) deleteIngredient(state.confirmDel.cat, state.confirmDel.nom);
        closeConfirm();
    });
    document.getElementById('confirm-modal').addEventListener('click', (e) => {
        if (e.target.id === 'confirm-modal') closeConfirm();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePromptModal();
            closeConfirm();
        }
    });
}

init();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
