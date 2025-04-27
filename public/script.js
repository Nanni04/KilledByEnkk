// Variabili globali per gli elementi DOM (mantieni queste)
const gamesContainer = document.getElementById('games-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
// ... (mantieni gli altri selettori DOM) ...
const totalGamesEl = document.getElementById('total-games');
const abandonedCountEl = document.getElementById('abandoned-count');
const inProgressCountEl = document.getElementById('in-progress-count');
const toStartCountEl = document.getElementById('to-start-count');
const completedCountEl = document.getElementById('completed-count');
// ... (mantieni gli altri selettori DOM per i prezzi se li usi) ...

// Variabile globale per contenere i dati dei giochi caricati
let games = [];
let currentFilter = 'all';
let editingGameId = null; // Mantieni se prevedi modifica

// --- FUNZIONE DI INIZIALIZZAZIONE MODIFICATA ---
async function init() {
    try {
        // URL da cui caricare i dati (file locale per ora, poi API Render)
        const dataUrl = 'games.json'; // <-- Cambierai questo con l'URL della tua API Render
        const response = await fetch(dataUrl);

        if (!response.ok) {
            throw new Error(`Errore HTTP! status: ${response.status}`);
        }

        games = await response.json(); // Carica i dati nella variabile globale 'games'

        // Ora che i dati sono caricati, inizializza il resto
        renderGames();
        updateCounters();
        setupEventListeners(); // Raggruppiamo l'aggiunta degli event listener

        console.log("Dati dei giochi caricati con successo.");

    } catch (error) {
        console.error("Impossibile caricare i dati dei giochi:", error);
        // Mostra un messaggio di errore all'utente nel contenitore dei giochi
        gamesContainer.innerHTML = `
            <li class="game-item" style="justify-content: center; text-align: center; color: var(--abandoned);">
                <p>Errore nel caricamento dei dati dei giochi. Riprova più tardi.</p>
            </li>
        `;
        // Potresti voler disabilitare filtri/ricerca qui
    }
}

// Funzione per impostare gli event listener (dopo il caricamento dei dati)
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(renderGames, 300)); // Aggiunto debounce per performance

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGames();
        });
    });

    // Mantieni gli listener per modale e form se li usi
    /*
    modalClose.addEventListener('click', closeModal);
    gameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveGame();
    });
    completionRange.addEventListener('input', () => {
         completionValue.textContent = `${completionRange.value}%`;
    });
    gameStatus.addEventListener('change', toggleCompletionVisibility);
    */

    // Delegazione eventi per i pulsanti PEM (e Modifica se presente)
    gamesContainer.addEventListener('click', (e) => {
        const pemBtn = e.target.closest('.pem-btn');
        const editBtn = e.target.closest('.edit-btn'); // Se hai il pulsante modifica

        if (pemBtn) {
            const gameId = parseInt(pemBtn.dataset.gameId);
            pemGame(gameId);
        }

        if (editBtn) {
            // const gameId = parseInt(editBtn.dataset.gameId);
            // editGame(gameId); // Implementa la funzione editGame se necessario
            console.log("Funzione Modifica non ancora implementata con API");
            showToast("Funzione Modifica non ancora implementata con API", 'error');
        }
    });
}


// --- FUNZIONI PRINCIPALI (renderGames, createGameElement, updateCounters, ecc.) ---
// Queste funzioni (renderGames, createGameElement, updateCounters, pemGame, showToast, debounce)
// rimangono sostanzialmente le stesse di prima, poiché ora operano sulla variabile
// globale 'games' che viene popolata all'inizio da init().

// Assicurati che createGameElement usi correttamente i dati da 'game'
function createGameElement(game) {
    const li = document.createElement('li');
    li.className = 'game-item';
    li.dataset.status = game.status;
    li.dataset.id = game.id; // Utile aggiungere l'ID qui

    let statusClass = '';
    let statusText = '';
    let dateClass = '';

    // ... (logica switch per status/date class come prima) ...
    switch (game.status) {
        case 'abandoned':
            statusClass = 'status-abandoned';
            statusText = 'Abbandonato';
            dateClass = 'date-abandoned';
            break;
        case 'in-progress':
            statusClass = 'status-in-progress';
            statusText = 'Iniziato';
            dateClass = 'date-in-progress';
            break;
        case 'to-start':
            statusClass = 'status-to-start';
            statusText = 'Da Iniziare'; // O 'Comprato'
            dateClass = 'date-to-start';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = 'Completato';
            dateClass = 'date-completed';
            break;
        default: // Aggiungi un default per sicurezza
            statusClass = 'status-unknown';
            statusText = 'Sconosciuto';
            dateClass = 'date-unknown';
    }

    // Creare il contenuto dell'elemento (come prima, assicurati che usi game.proprietà)
    let completionInfo = '';
    // Gestisci game.completion == null o undefined
    const completionPercent = (game.completion !== null && game.completion !== undefined) ? game.completion : 0;
    if (game.status === 'in-progress' || game.status === 'abandoned' || game.status === 'completed') {
        completionInfo = `
            <div class="completion-info">
                <div class="completion-bar">
                    <div class="completion-progress" style="width: ${completionPercent}%;"></div>
                </div>
                <div class="completion-percentage">${completionPercent}%</div>
            </div>
        `;
    }

    let actionButtons = '';
    // Aggiungi pulsanti modifica/pem solo se necessario e implementato
    if (game.status === 'in-progress') { // O altre condizioni se vuoi modificarli tutti
         actionButtons = `
            <div class="action-buttons">
                 <button class="action-btn pem-btn" data-game-id="${game.id}" title="Marca come Abbandonato (PEM)">
                     <i class="fas fa-skull"></i> PEM
                 </button>
                 <!-- <button class="action-btn edit-btn" data-game-id="${game.id}" title="Modifica Dettagli">
                     <i class="fas fa-edit"></i> Modifica
                 </button> -->
            </div>
         `;
    }

    let priceTag = '';
    if (game.price && game.price.toLowerCase() !== 'free or not specified' && game.price.toLowerCase() !== 'free') {
        priceTag = `<span class="steam-price"><i class="fab fa-steam"></i> ${game.price}</span>`;
    } else if (game.price && game.price.toLowerCase() === 'free') {
         priceTag = `<span class="steam-price" style="color: var(--completed);"><i class="fab fa-steam"></i> Free</span>`;
    }

    // Gestisci genre e platform null o vuoti
    let gameDescription = '';
    if (game.genre) {
        gameDescription += `<span><i class="fas fa-gamepad"></i> ${game.genre}</span>`;
    }
    if (game.platform) {
        gameDescription += `<span><i class="fas fa-desktop"></i> ${game.platform}</span>`;
    }
    if (game.hours) {
        gameDescription += `<span><i class="fas fa-clock"></i> ${game.hours}${typeof game.hours === 'number' ? ' ore' : ''}</span>`;
    }

    li.innerHTML = `
        <div class="status-indicator ${statusClass}"></div>
        <div class="game-info">
            <div class="game-title">
                ${game.title}
                ${priceTag}
            </div>
            <div class="game-description">
                ${gameDescription || '<span><i class="fas fa-info-circle"></i> Nessuna descrizione</span>'}
            </div>
            ${completionInfo}
            ${actionButtons}
        </div>
        <div class="date-info">
            <div>${statusText}</div>
            <div class="${dateClass}">${game.date || 'N/A'}</div>
        </div>
    `;

    return li;
}

function renderGames() {
    gamesContainer.innerHTML = ''; // Pulisci la lista

    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredGames = games.filter(game => {
        // Assicurati che game.title esista prima di chiamare toLowerCase
        const titleMatch = game.title && game.title.toLowerCase().includes(searchTerm);
        const filterMatch = currentFilter === 'all' || game.status === currentFilter;
        return titleMatch && filterMatch;
    });

    // Ordina per data (più recente prima), convertendo le date in oggetti Date per un confronto affidabile
    filteredGames.sort((a, b) => {
        // Funzione helper per provare a parsare date in formati diversi
        const parseDate = (dateString) => {
            if (!dateString) return null;
            // Prova formati comuni (es. "7 Apr 2025", "Aug 2024", "2023")
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                 // Se è una data valida tipo "7 Apr 2025"
                 return date;
            } else if (/^\w+ \d{4}$/.test(dateString)) { // "Aug 2024"
                 return new Date(dateString.replace(" ", " 1, ")); // Aggiunge un giorno fittizio
            } else if (/^\d{4}$/.test(dateString)) { // "2024"
                 return new Date(dateString, 0, 1); // Gennaio 1 dell'anno
            }
            return null; // Non parsabile
        };

        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);

        // Gestisci date nulle o non parsabili (mettendole alla fine)
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // Metti a dopo b
        if (!dateB) return -1; // Metti b dopo a

        return dateB - dateA; // Ordine decrescente (più recente prima)
    });


    if (filteredGames.length === 0) {
        gamesContainer.innerHTML = `
            <li class="game-item" style="justify-content: center; text-align: center;">
                <p>Nessun gioco trovato con i criteri selezionati.</p>
            </li>
        `;
        return;
    }

    filteredGames.forEach(game => {
        const gameElement = createGameElement(game);
        gamesContainer.appendChild(gameElement);
    });
}


// --- Funzione PEM (per ora modifica solo l'array locale) ---
function pemGame(gameId) {
    const index = games.findIndex(g => g.id === gameId);
    if (index !== -1 && games[index].status === 'in-progress') {
        games[index].status = 'abandoned';

        // Data attuale formattata
        const today = new Date();
        const day = today.getDate();
        const month = today.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''); // Formato mese italiano
        const year = today.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;

        games[index].date = formattedDate;
        games[index].completion = games[index].completion || 0; // Assicura che completion non sia null

        // --- !!! SEZIONE API !!! ---
        // Qui, invece di (o in aggiunta a) modificare l'array locale,
        // dovresti fare una chiamata API (es. PUT o PATCH) al tuo backend Render
        // per aggiornare lo stato del gioco nel file JSON sul server (o nel database).
        // Esempio concettuale:
        // updateGameOnServer(games[index]);

        renderGames(); // Ri-renderizza la lista con lo stato aggiornato
        updateCounters(); // Aggiorna i contatori
        showToast(`Gioco "${games[index].title}" spostato in Abbandonati! PEM!`, 'success');
    } else if (index !== -1) {
        showToast(`Il gioco "${games[index].title}" non è "In Corso".`, 'error');
    } else {
         showToast(`Gioco con ID ${gameId} non trovato.`, 'error');
    }
}

// --- Funzioni ausiliarie (showToast, debounce, updateCounters, ecc.) ---
// Mantieni queste funzioni come sono, assicurandoti che 'updateCounters'
// legga correttamente dalla variabile globale 'games'.
function updateCounters() {
    if (!games || games.length === 0) {
        // Se i giochi non sono ancora caricati o l'array è vuoto, imposta i contatori a 0
        totalGamesEl.textContent = 0;
        abandonedCountEl.textContent = 0;
        inProgressCountEl.textContent = 0;
        toStartCountEl.textContent = 0;
        completedCountEl.textContent = 0;
        // Resetta anche i prezzi se li usi
        return;
    }

    const total = games.length;
    const abandoned = games.filter(g => g.status === 'abandoned').length;
    const inProgress = games.filter(g => g.status === 'in-progress').length;
    const toStart = games.filter(g => g.status === 'to-start').length;
    const completed = games.filter(g => g.status === 'completed').length;

    totalGamesEl.textContent = total;
    abandonedCountEl.textContent = abandoned;
    inProgressCountEl.textContent = inProgress;
    toStartCountEl.textContent = toStart;
    completedCountEl.textContent = completed;

    // Aggiorna i prezzi totali se necessario (mantieni la funzione calculateTotalPrices se la usi)
    // const prices = calculateTotalPrices();
    // ... aggiorna elementi prezzo ...
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.innerHTML = `
        <i class="${icon}"></i>
        <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                 toast.remove();
            }
        }, 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// --- Avvio dell'applicazione ---
// Assicurati che il DOM sia pronto prima di chiamare init
document.addEventListener('DOMContentLoaded', init);