/**
 * Génère un fichier Excel de test avec plus de 15 000 lignes.
 * Colonnes : Prénoms, Nom, ID / N° de carte, Type de contrat.
 * Usage : node scripts/generate-big-excel.js
 */

import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ROW_COUNT = 15001;
const TYPES = ['Business', 'Premier', 'Platinum'];
const PRENOMS = ['Jean', 'Marie', 'Paul', 'Sophie', 'Pierre', 'Julie', 'Thomas', 'Camille', 'Nicolas', 'Léa', 'Antoine', 'Manon', 'François', 'Claire', 'David', 'Emma', 'Alexandre', 'Chloé', 'Maxime', 'Laura'];
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];

const headers = ['Prénoms', 'Nom', 'ID / N° de carte', 'Type de contrat'];
const rows = [headers];

for (let i = 1; i <= ROW_COUNT; i++) {
    const prenom = PRENOMS[(i - 1) % PRENOMS.length] + (i > PRENOMS.length ? `-${Math.floor((i - 1) / PRENOMS.length)}` : '');
    const nom = NOMS[(i - 1) % NOMS.length] + (i > NOMS.length ? `-${Math.floor((i - 1) / NOMS.length)}` : '');
    const idCarte = String(1000000000000000 + i).slice(0, 20);
    const typeContrat = TYPES[(i - 1) % TYPES.length];
    rows.push([prenom, nom, idCarte, typeContrat]);
}

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Contrats');

const outPath = join(__dirname, '..', 'modele_contrats_15000_lignes.xlsx');
XLSX.writeFile(wb, outPath);

console.log(`Fichier généré : ${outPath} (${ROW_COUNT} lignes de données)`);
