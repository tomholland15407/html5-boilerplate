/**
 * Where the chat backend lives.
 *
 * Empty means same origin, which is what ./run.sh gives you: FastAPI serves this
 * page and the API together on :8000, and nothing here needs setting.
 *
 * It matters when the page is hosted somewhere the model is not — Vercel serving
 * this folder while Ollama and the 13,754-row catalog stay on a laptop behind a
 * tunnel. A quick tunnel hands out a new hostname every time it starts, so
 * rather than baking one in and redeploying, the base can be set from the link:
 *
 *     https://your-app.vercel.app/?api=https://xyz.trycloudflare.com
 *
 * It is remembered afterwards, so that link is only needed once per hostname.
 * Visiting with a bare ?api= forgets it again and goes back to same origin,
 * which is how you undo it on a machine you have been testing on.
 */
(function () {
  'use strict';

  var DEFAULT_BASE = '';          // same origin
  var STORE_KEY = 'dmx-api-base';

  // Only ever used as the prefix of a fetch URL, but validate the shape anyway
  // rather than let anything with a colon in it through.
  function clean(value) {
    if (value == null) return null;
    var v = String(value).trim().replace(/\/+$/, '');
    return /^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/i.test(v) ? v : null;
  }

  function read(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  function write(key, value) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch { /* private browsing, storage disabled — not worth failing over */ }
  }

  var base = clean(read(STORE_KEY)) || DEFAULT_BASE;

  try {
    var params = new URLSearchParams(window.location.search);
    if (params.has('api')) {
      var asked = clean(params.get('api'));
      base = asked || DEFAULT_BASE;
      write(STORE_KEY, asked);     // null clears it
    }
  } catch { /* no URLSearchParams: fall back to whatever was stored */ }

  window.CHAT_API_BASE = base;
})();
