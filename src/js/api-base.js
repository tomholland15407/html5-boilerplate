/**
 * The deployed backend address, written at deploy time.
 *
 * This file is a placeholder in the repository and deliberately empty: served
 * by ./run.sh the page and the API share an origin, so there is nothing to
 * point at. Vercel overwrites it during the build from the CHAT_API_BASE
 * environment variable, which is where the laptop's address lives so it stays
 * out of a public repo.
 *
 * Kept separate from config.js so the generated line is the whole file, and a
 * build that writes it cannot disturb the logic that reads it.
 */
window.CHAT_API_DEFAULT = '';
