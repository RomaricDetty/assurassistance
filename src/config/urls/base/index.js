/** URL de base de l'API. Chargée depuis .env à la racine du projet (Vite ne lit pas src/.env). */
export const BASE_URL = import.meta.env.VITE_BASE_URL ?? 'http://localhost:3000';