      
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Usiamo la versione basata su Promise per async/await

const app = express();
const PORT = process.env.PORT || 3000;

// Percorso del file JSON (assumendo che sia nella cartella 'public')
const GAMES_JSON_PATH = path.join(__dirname, 'public', 'games.json');

// --- Middleware ---
// Per servire i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));
// Per parsare il body delle richieste PUT/POST in formato JSON
app.use(express.json()); // IMPORTANTE: Aggiungi questo PRIMA delle route API

// --- API Route: GET /api/games ---
// Restituisce il contenuto attuale di games.json
app.get('/api/games', async (req, res) => {
    console.log('Richiesta GET /api/games ricevuta');
    try {
        // Legge il file
        const data = await fs.readFile(GAMES_JSON_PATH, 'utf8');
        // Parsa il JSON e lo invia
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Errore leggendo games.json:', error);
        // Gestione specifica se il file non esiste
        if (error.code === 'ENOENT') {
             // Potresti decidere di restituire un array vuoto invece di un errore 404
             // return res.json([]);
             res.status(404).json({ message: 'File dei giochi non trovato.' });
        } else {
             // Errore generico del server
             res.status(500).json({ message: 'Errore interno del server durante la lettura dei giochi.' });
        }
    }
});

// --- API Route: PUT /api/games/:id ---
// Aggiorna un gioco specifico nel file games.json
app.put('/api/games/:id', async (req, res) => {
    const gameId = parseInt(req.params.id, 10); // Estrai l'ID e convertilo in numero
    const updatedGameData = req.body; // I dati aggiornati inviati dal client

    console.log(`Richiesta PUT /api/games/${gameId} ricevuta con body:`, updatedGameData);

    // Validazione di base dell'input
    if (isNaN(gameId)) {
        return res.status(400).json({ message: 'ID del gioco non valido.' });
    }
    // Controlla che ci sia un body
    if (!updatedGameData || Object.keys(updatedGameData).length === 0) {
        return res.status(400).json({ message: 'Dati del gioco mancanti o vuoti nel body della richiesta.' });
    }
    // Assicura coerenza dell'ID (URL vs Body)
    if (updatedGameData.id && updatedGameData.id !== gameId) {
        console.warn(`Attenzione: ID nel body (${updatedGameData.id}) non corrisponde all'ID nell'URL (${gameId}). Uso l'ID dell'URL.`);
    }
    // Forza l'ID corretto nell'oggetto dati
    updatedGameData.id = gameId;

    try {
        // 1. Leggi il file JSON attuale
        let gamesData = [];
        try {
            const data = await fs.readFile(GAMES_JSON_PATH, 'utf8');
            gamesData = JSON.parse(data);
            // Controlla se è effettivamente un array
            if (!Array.isArray(gamesData)) {
                 console.error("Errore critico: Il contenuto di games.json non è un array.");
                 throw new Error("Formato dati non valido nel file JSON.");
            }
        } catch (readError) {
             // Se il file non esiste non possiamo aggiornare nulla
             if (readError.code === 'ENOENT') {
                console.error("File games.json non trovato, impossibile aggiornare.");
                 return res.status(404).json({ message: 'File dei giochi non trovato, impossibile aggiornare.' });
             } else {
                 // Altro errore di lettura/parsing
                 console.error("Errore durante lettura/parsing di games.json per l'aggiornamento:", readError);
                 throw readError; // Rilancia l'errore per il catch esterno
             }
        }

        // 2. Trova l'indice del gioco da aggiornare
        const gameIndex = gamesData.findIndex(game => game.id === gameId);

        // 3. Se non trovato, invia errore 404
        if (gameIndex === -1) {
            console.log(`Gioco con ID ${gameId} non trovato per l'aggiornamento.`);
            return res.status(404).json({ message: `Gioco con ID ${gameId} non trovato.` });
        }

        // 4. Aggiorna l'oggetto gioco nell'array (sostituzione completa)
        console.log(`Gioco trovato all'indice ${gameIndex}. Aggiorno con:`, updatedGameData);
        gamesData[gameIndex] = updatedGameData;

        // 5. Scrivi l'intero array aggiornato di nuovo nel file JSON
        //    Usiamo null, 2 per formattare il JSON in modo leggibile (indentazione)
        await fs.writeFile(GAMES_JSON_PATH, JSON.stringify(gamesData, null, 2), 'utf8');
        console.log(`File games.json aggiornato con successo per il gioco ID ${gameId}.`);

        // 6. Invia una risposta di successo con il gioco aggiornato
        res.status(200).json(gamesData[gameIndex]);

    } catch (error) {
        console.error(`Errore durante l'aggiornamento del gioco ID ${gameId}:`, error);
        res.status(500).json({ message: 'Errore interno del server durante l\'aggiornamento del gioco.' });
    }
});


// --- Route di Fallback per servire index.html ---
// Questa route cattura tutte le altre richieste GET che non corrispondono
// a file statici o alle route API definite sopra. Utile per SPA.
// Deve essere definita DOPO le route API e statiche.
app.get('*', (req, res) => {
  // Verifica che non sia una richiesta API per errore
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Avvio del Server ---
app.listen(PORT, () => {
  console.log(`---------------------------------------------------------`);
  console.log(`Server KilledByEnkk in ascolto sulla porta ${PORT}`);
  console.log(`Servizio file statici da: ${path.join(__dirname, 'public')}`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/games`);
  console.log(`  PUT  /api/games/:id`);
  console.log(`---------------------------------------------------------`);
});

// --- Nota sulla persistenza del filesystem su Render ---
// Scrivere file su Render può essere non persistente tra deploy/riavvii.
// Per dati critici o modifiche frequenti, considera un database.
// Per questa applicazione con modifiche occasionali (PEM), potrebbe bastare.

