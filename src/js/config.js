/**
 * Where the chat backend lives, in order of precedence:
 *
 *   1. ?api=https://…  on this visit, remembered afterwards
 *   2. whatever a previous ?api= stored, unless the deployment has moved since
 *   3. the address baked in at deploy time by js/api-base.js
 *   4. same origin — which is ./run.sh, where FastAPI serves the page and the
 *      API together and none of this applies
 *
 * The stored value records which deployment default it was chosen against. If
 * that default later changes — a new tunnel address shipped — the override is
 * dropped rather than left to quietly point a browser at an address that has
 * moved on. A bare ?api= clears it by hand.
 */
(function () {
  'use strict';

  var DEFAULT_BASE = typeof window.CHAT_API_DEFAULT === 'string'
    ? window.CHAT_API_DEFAULT : '';
  var STORE_KEY = 'dmx-api-base';
  var STORE_AGAINST = 'dmx-api-base-for';

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

  var stored = clean(read(STORE_KEY));
  if (stored && read(STORE_AGAINST) !== DEFAULT_BASE) {
    // The deployment now points somewhere else; this override is stale.
    write(STORE_KEY, null);
    write(STORE_AGAINST, null);
    stored = null;
  }
  var base = stored || DEFAULT_BASE;

  try {
    var params = new URLSearchParams(window.location.search);
    if (params.has('api')) {
      var asked = clean(params.get('api'));
      base = asked || DEFAULT_BASE;
      write(STORE_KEY, asked);          // null clears it
      write(STORE_AGAINST, asked ? DEFAULT_BASE : null);
    }
  } catch { /* no URLSearchParams: fall back to whatever was stored */ }

  window.CHAT_API_BASE = base;
})();
