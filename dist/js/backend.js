/**
 * Live backend wiring.
 *
 * Loaded after app.js and overrides two of its globals: the mock logic engine,
 * and the submit handler's 1300 ms "thinking" pause — which was fine against
 * canned data but would spend a quarter of the real latency budget pretending
 * to work.
 *
 * The order things arrive on screen is the point. Retrieval finishes in ~40 ms,
 * so the product cards render almost immediately; the model's prose then streams
 * in above them. A 3.5 s answer reads as instant because the useful part was
 * never waiting on the model.
 */
(function () {
  'use strict';

  const API = window.CHAT_API_BASE || '';
  const SESSION_KEY = 'dmx-session-id';

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  const $ = (id) => document.getElementById(id);
  const setDebug = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const vnd = (n) => (window.formatVND ? window.formatVND(n)
    : new Intl.NumberFormat('vi-VN').format(n || 0) + '₫');

  // ---------------------------------------------------------------- rendering

  function productCard(p, idx) {
    const specs = Object.entries(p.features || {}).slice(0, 3).map(([k, v]) => {
      const LABEL = {
        battery_mah: ['Pin', 'mAh'], ram_gb: ['RAM', 'GB'], storage_gb: ['Bộ nhớ', 'GB'],
        screen_inch: ['Màn hình', '"'], capacity_l: ['Dung tích', ' lít'],
        wash_kg: ['Khối lượng giặt', ' kg'], power_w: ['Công suất', 'W'],
        weight_kg: ['Trọng lượng', ' kg'], cooling_hp: ['Công suất', ' HP'],
        camera_mp: ['Camera', ' MP'], refresh_hz: ['Tần số quét', 'Hz'],
        battery_hours: ['Thời lượng pin', ' giờ'], cpu_ghz: ['CPU', ' GHz'],
        water_atm: ['Kháng nước', ' ATM']
      }[k];
      if (!LABEL) return '';
      const shown = Number.isInteger(v) ? v : Math.round(v * 10) / 10;
      return `<li><i class="fa-solid fa-circle-check text-paper-400 mr-1.5"></i>${LABEL[0]}: <strong>${shown}${LABEL[1]}</strong></li>`;
    }).filter(Boolean).join('');

    const off = p.discount_pct && p.discount_pct >= 0.05
      ? `<span class="sk-badge sk-edge sk-edge-soft sk-edge-single px-2.5 py-0.5 text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400">-${Math.round(p.discount_pct * 100)}%</span>` : '';

    const was = p.price_list && p.price_list > p.price
      ? `<span class="text-[11px] line-through text-paper-400 ml-2">${vnd(p.price_list)}</span>` : '';

    const reasons = (p.reasons || []).map((r) =>
      `<span class="inline-block text-[10px] px-2 py-0.5 mr-1 mb-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded">${escapeHtml(r)}</span>`).join('');

    const promo = p.promotion
      ? `<p class="text-[11px] text-amber-700 dark:text-amber-400 mt-2.5 flex items-start"><i class="fa-solid fa-gift mr-1.5 mt-0.5 text-xs shrink-0"></i><span>${escapeHtml(p.promotion)}</span></p>` : '';

    const img = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="" loading="lazy" class="w-full h-28 object-contain mb-2" onerror="this.style.display='none'">` : '';

    return `
      <div class="sk-edge sk-lift sk-fill-amber ${idx % 2 === 0 ? 'sk-card' : 'sk-card-alt sk-edge-alt'} bg-amber-50/60 dark:bg-amber-950/20 p-4 border border-amber-200/80 dark:border-amber-500/20 flex flex-col justify-between space-y-3 shadow-sm transition-all hover:shadow-md hover:border-amber-400/80">
        <div>
          <div class="flex items-center justify-between">
            <span class="sk-badge sk-edge sk-edge-soft sk-edge-single sk-fill-accent px-2.5 py-0.5 text-[10px] bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">Đề xuất ${idx + 1}</span>
            ${off}
          </div>
          ${img}
          <h3 class="text-[12.5px] text-black dark:text-white mt-2 line-clamp-2 h-9 leading-snug">${escapeHtml(p.name)}</h3>
          <div class="text-[15px] text-[#8a4a1c] dark:text-brand-electric mt-1.5">${vnd(p.price)}${was}</div>
          ${specs ? `<ul class="sk-panel sk-edge sk-edge-soft sk-edge-single sk-fill-paper-2 text-[11px] text-paper-inksoft dark:text-stone-400 mt-2.5 space-y-1 bg-paper-50/60 dark:bg-black/20 p-3 border border-amber-100 dark:border-brand-border/30">${specs}</ul>` : ''}
          <div class="mt-2.5">${reasons}</div>
          ${promo}
        </div>
        <a href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener noreferrer"
           class="sk-pill sk-edge sk-edge-strong sk-lift w-full custom-btn-select text-xs py-2.5 text-center transition-all shadow-sm">Xem chi tiết</a>
      </div>`;
  }

  function chipsHtml(chips) {
    if (!chips || !chips.length) return '';
    return `<div class="flex flex-wrap gap-2 mt-3">` + chips.map((c) =>
      `<button type="button" class="dmx-chip sk-pill sk-edge sk-edge-soft text-[11px] px-3 py-1.5 bg-white/70 dark:bg-black/20 border border-amber-200 dark:border-brand-border/40 hover:border-amber-400 transition" data-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('') + `</div>`;
  }

  // Chips act as if the shopper typed them.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.dmx-chip');
    if (!btn) return;
    const input = $('user-input');
    if (!input) return;
    input.value = btn.dataset.chip || btn.textContent.trim();
    const form = $('chat-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  // ------------------------------------------------------------------ stream

  async function streamChat(text) {
    const t0 = performance.now();
    let bubble = null;      // the assistant message element being written into
    let prose = '';
    let cardsHtml = '';
    let notesHtml = '';

    // Create the bubble up front so tokens have somewhere to land.
    if (window.appendAssistantMessage) {
      window.appendAssistantMessage('<span class="dmx-stream"></span>');
      const all = document.querySelectorAll('.dmx-stream');
      bubble = all[all.length - 1];
    }
    const paint = () => {
      if (!bubble) return;
      bubble.innerHTML =
        `<p class="text-[13.5px] leading-relaxed mb-3 text-paper-ink dark:text-slate-200">${escapeHtml(prose)}</p>`
        + notesHtml + cardsHtml;
      if (window.scrollChatToBottom) window.scrollChatToBottom();
    };

    let res;
    try {
      res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId })
      });
    } catch (err) {
      prose = 'Mình không kết nối được tới máy chủ. Bạn kiểm tra giúp backend đang chạy nhé.';
      paint();
      return;
    }
    if (!res.ok || !res.body) {
      prose = 'Máy chủ đang bận, bạn thử lại giúp mình nhé.';
      paint();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let event = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split('\n')) {
          if (line.startsWith('event: ')) { event = line.slice(7).trim(); continue; }
          if (!line.startsWith('data: ')) continue;
          let d;
          try { d = JSON.parse(line.slice(6)); } catch (_) { continue; }

          if (event === 'products') {
            cardsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">`
              + (d.products || []).map(productCard).join('') + `</div>`;
            if (d.notes && d.notes.length) {
              notesHtml = `<div class="text-[11px] text-paper-inksoft dark:text-stone-400 mb-2">`
                + d.notes.map((n) => `<div>· ${escapeHtml(n)}</div>`).join('') + `</div>`;
            }
            setDebug('rag-faq-status', `Khớp ${d.total_matched} sản phẩm`);
            paint();
          } else if (event === 'token') {
            prose += d.text;
            paint();
          } else if (event === 'replace') {
            // Server retracted its own text — a mid-sentence cut, or a figure
            // that failed verification against the catalog rows.
            prose = d.text;
            paint();
          } else if (event === 'chips') {
            cardsHtml = chipsHtml(d.chips);
            paint();
          } else if (event === 'done') {
            setDebug('latency-val', Math.round(d.ms || (performance.now() - t0)) + 'ms');
            if (d.slang && d.slang.length) setDebug('slang-inspector', JSON.stringify(d.slang));
            if (d.kind) setDebug('chat-stage', d.kind.toUpperCase());
            if (d.debug && d.debug.candidates != null) {
              setDebug('rag-faq-status', `Còn ${d.debug.candidates} lựa chọn`);
            }
          }
        }
      }
    }
    paint();
  }

  // ------------------------------------------------------- global overrides

  window.dispatchLogicEngine = function (text) { streamChat(text); };

  // Replaces app.js's version, which waited 1300 ms before dispatching.
  window.handleFormSubmit = function (event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const input = $('user-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (!window.activeSessionId && window.createNewChatSession) window.createNewChatSession();
    if (window.dismissSuggestionArc) window.dismissSuggestionArc();
    if (window.appendUserMessage) window.appendUserMessage(val);
    input.value = '';
    if (window.triggerMascotJiggle) window.triggerMascotJiggle();
    streamChat(val);
  };

  // app.js may have bound its own handler already; take over the form.
  document.addEventListener('DOMContentLoaded', () => {
    const form = $('chat-form');
    if (!form) return;
    const fresh = form.cloneNode(true);
    form.parentNode.replaceChild(fresh, form);
    fresh.addEventListener('submit', window.handleFormSubmit);

    fetch(`${API}/api/health`).then((r) => r.json()).then((h) => {
      setDebug('rag-faq-status', `Sẵn sàng · ${h.products.toLocaleString('vi-VN')} sản phẩm`);
    }).catch(() => setDebug('rag-faq-status', 'Backend chưa chạy'));
  });
})();
