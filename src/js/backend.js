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
 *
 * One chat in the sidebar is one session on the server. When the shopper moves
 * from phones to laptops the server says so, and the turn is lifted into a
 * chat of its own rather than being appended to the wrong conversation.
 */
(function () {
  'use strict';

  const API = window.CHAT_API_BASE || '';
  const SESSION_KEY = 'dmx-session-id';

  const newSessionId = () =>
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  // Used only until app.js has a chat to hang a session on.
  let fallbackSessionId = sessionStorage.getItem(SESSION_KEY);
  if (!fallbackSessionId) {
    fallbackSessionId = newSessionId();
    sessionStorage.setItem(SESSION_KEY, fallbackSessionId);
  }

  const $ = (id) => document.getElementById(id);
  const setDebug = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const vnd = (n) => (window.formatVND ? window.formatVND(n)
    : new Intl.NumberFormat('vi-VN').format(n || 0) + '₫');

  // ------------------------------------------------------------- chat/session

  const chatApi = () => window.dmxChat || null;
  const activeChat = () => (chatApi() ? chatApi().active() : null);

  // Each chat carries the id of the server session that holds its state, so
  // clicking back into an older conversation resumes exactly where it stopped.
  function sessionIdFor(chat) {
    if (!chat) return fallbackSessionId;
    if (!chat.backendId) chat.backendId = newSessionId();
    return chat.backendId;
  }

  function titleFor(label) {
    return label ? `Tư vấn ${label}` : null;
  }

  // ---------------------------------------------------------------- rendering

  const SPEC_LABEL = {
    battery_mah: ['Pin', 'mAh'], ram_gb: ['RAM', 'GB'], storage_gb: ['Bộ nhớ', 'GB'],
    screen_inch: ['Màn hình', '"'], capacity_l: ['Dung tích', ' lít'],
    wash_kg: ['Khối lượng giặt', ' kg'], power_w: ['Công suất', 'W'],
    weight_kg: ['Trọng lượng', ' kg'], cooling_hp: ['Công suất', ' HP'],
    camera_mp: ['Camera', ' MP'], refresh_hz: ['Tần số quét', 'Hz'],
    battery_hours: ['Thời lượng pin', ' giờ'], cpu_ghz: ['CPU', ' GHz'],
    water_atm: ['Kháng nước', ' ATM']
  };

  /**
   * The trade-off note the mock engine used to show, rebuilt from the rows the
   * server actually returned. It only ever states where this product sits on
   * price among the three on screen, which is read off the cards themselves —
   * nothing here asserts a fact the catalog has not supplied.
   */
  function tradeOff(p, all) {
    const prices = all.map((x) => x.price).filter((n) => n > 0);
    if (prices.length < 2) return '';
    const lo = Math.min(...prices);
    const hi = Math.max(...prices);
    if (hi === lo) return 'Ba mẫu cùng tầm giá, khác nhau chủ yếu ở thông số và thương hiệu.';
    if (p.price === lo) return 'Rẻ nhất trong ba mẫu — đổi lại tính năng và cấu hình ở mức cơ bản hơn.';
    if (p.price === hi) return 'Nhiều tính năng nhất nhóm này, bù lại chi phí ban đầu cao hơn hai mẫu còn lại.';
    return 'Nằm giữa về giá — cân bằng giữa chi phí và tính năng.';
  }

  function productCard(p, idx, all) {
    const specs = Object.entries(p.features || {}).slice(0, 3).map(([k, v]) => {
      const LABEL = SPEC_LABEL[k];
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

    const note = tradeOff(p, all);
    const noteHtml = note
      ? `<div class="sk-panel sk-edge sk-edge-soft sk-edge-single sk-fill-paper-2 bg-white dark:bg-amber-900/20 p-3 text-[11px] text-amber-900 dark:text-amber-400 border border-amber-200/60 leading-relaxed">
           <strong class="text-inherit">Điểm đánh đổi:</strong> ${escapeHtml(note)}
         </div>` : '';

    const detail = p.url
      ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer"
            class="block text-center text-[11px] text-paper-inksoft dark:text-stone-400 hover:text-paper-ink dark:hover:text-white underline underline-offset-2">Xem chi tiết</a>` : '';

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
        ${noteHtml}
        <div class="space-y-2">
          <button type="button" class="dmx-buy sk-pill sk-edge sk-edge-strong sk-lift w-full custom-btn-select text-xs py-2.5 text-center transition-all shadow-sm">Đặt Mua Ngay</button>
          ${detail}
        </div>
      </div>`;
  }

  function chipsHtml(chips) {
    if (!chips || !chips.length) return '';
    return `<div class="flex flex-wrap gap-2 mt-3">` + chips.map((c) =>
      `<button type="button" class="dmx-chip sk-pill sk-edge sk-edge-soft text-[11px] px-3 py-1.5 bg-white/70 dark:bg-black/20 border border-amber-200 dark:border-brand-border/40 hover:border-amber-400 transition" data-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join('') + `</div>`;
  }

  document.addEventListener('click', (e) => {
    // The buy confirmation app.js already knows how to render.
    if (e.target.closest('.dmx-buy')) {
      if (window.handleBuyProduct) window.handleBuyProduct();
      return;
    }
    // Chips act as if the shopper typed them.
    const btn = e.target.closest('.dmx-chip');
    if (!btn) return;
    const input = $('user-input');
    if (!input) return;
    input.value = btn.dataset.chip || btn.textContent.trim();
    const form = $('chat-form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });

  // ------------------------------------------------------------------ stream

  /**
   * Lift a turn into a chat of its own.
   *
   * The message was typed into the conversation about phones, but the server
   * has just said it is about laptops. The session id in hand now belongs to
   * the new subject and the previous conversation has been parked under
   * previous_session_id, so the old chat is repointed there and keeps its
   * history, while the message moves into a fresh chat on the current id.
   */
  function startDedicatedChat(userText, topic) {
    const from = activeChat();
    if (from && topic.previous_session_id) from.backendId = topic.previous_session_id;
    if (from && from.messages && from.messages.length) {
      const last = from.messages[from.messages.length - 1];
      if (last.role === 'user' && last.content === userText) from.messages.pop();
    }
    if (window.removeTypingIndicator) window.removeTypingIndicator();
    const box = $('chat-box');
    if (box && box.lastElementChild) box.lastElementChild.remove();

    const chat = window.createNewChatSession
      ? window.createNewChatSession(titleFor(topic.label) || 'Cuộc trò chuyện mới')
      : null;
    if (chat) {
      chat.backendId = topic.session_id;
      chat.category = topic.group || null;
      if (window.restoreSessionMessages) window.restoreSessionMessages(chat);
      if (window.renderChatHistoryUI) window.renderChatHistoryUI();
    }
    if (window.hideSuggestionArcNow) window.hideSuggestionArcNow();
    if (window.appendUserMessage) window.appendUserMessage(userText);
    if (window.showTypingIndicator) window.showTypingIndicator();
    return chat;
  }

  async function streamChat(text) {
    const t0 = performance.now();
    const startedIn = activeChat();
    let bubble = null;      // the assistant message element being written into
    let slot = null;        // where that message lives in the chat's history
    let prose = '';
    let cardsHtml = '';
    let chipsMarkup = '';
    let notesHtml = '';

    const render = () =>
      (prose ? `<p class="text-[13.5px] leading-relaxed mb-3 text-paper-ink dark:text-slate-200">${escapeHtml(prose)}</p>` : '')
      + notesHtml + cardsHtml + chipsMarkup;

    // Created on the first piece of content rather than up front, so a turn
    // that turns out to belong to another subject can be moved before anything
    // has been written into the wrong conversation.
    const ensureBubble = () => {
      if (bubble) return;
      if (window.removeTypingIndicator) window.removeTypingIndicator();
      if (!window.appendAssistantMessage) return;
      window.appendAssistantMessage('<span class="dmx-stream"></span>');
      const all = document.querySelectorAll('.dmx-stream');
      bubble = all[all.length - 1];
      const chat = activeChat();
      if (chat && chat.messages && chat.messages.length) {
        slot = { chat: chat, index: chat.messages.length - 1 };
      }
    };

    const paint = () => {
      ensureBubble();
      if (!bubble) return;
      bubble.innerHTML = render();
      // Keep the stored copy in step, or reopening this chat later shows the
      // placeholder the bubble started life as instead of the answer.
      if (slot) slot.chat.messages[slot.index].content = render();
      if (window.scrollChatToBottom) window.scrollChatToBottom();
    };

    const fail = (msg) => { prose = msg; paint(); };

    let res;
    try {
      res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionIdFor(startedIn) })
      });
    } catch (err) {
      fail('Mình không kết nối được tới máy chủ. Bạn kiểm tra giúp backend đang chạy nhé.');
      return;
    }
    if (!res.ok || !res.body) {
      fail('Máy chủ đang bận, bạn thử lại giúp mình nhé.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let event = null;

    try {
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

            if (event === 'topic') {
              // Arrives before any content, because the decision costs ~2 ms.
              if (d.changed) {
                startDedicatedChat(text, d);
              } else {
                const chat = activeChat();
                if (chat) {
                  if (d.session_id) chat.backendId = d.session_id;
                  if (d.group) chat.category = d.group;
                  const title = titleFor(d.label);
                  if (title && chat.title !== title && window.updateActiveSessionTitle) {
                    window.updateActiveSessionTitle(title, d.group);
                  }
                }
              }
              setDebug('active-category', d.label || 'Chưa xác định');
            } else if (event === 'products') {
              const list = d.products || [];
              cardsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">`
                + list.map((p, i) => productCard(p, i, list)).join('') + `</div>`;
              if (d.notes && d.notes.length) {
                notesHtml = `<div class="text-[11px] text-paper-inksoft dark:text-stone-400 mb-2">`
                  + d.notes.map((n) => `<div>· ${escapeHtml(n)}</div>`).join('') + `</div>`;
              }
              setDebug('rag-faq-status', `Khớp ${d.total_matched} sản phẩm`);
              setDebug('rag-catalog-status', `Tìm thấy ${list.length} mẫu`);
              const withPromo = list.filter((p) => p.promotion).length;
              setDebug('rag-promo-status', withPromo
                ? `${withPromo}/${list.length} mẫu đang có khuyến mãi`
                : 'Không có khuyến mãi kèm theo');
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
              chipsMarkup = chipsHtml(d.chips);
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
    } catch {
      if (!prose && !cardsHtml) {
        fail('Kết nối bị gián đoạn giữa chừng, bạn thử lại giúp mình nhé.');
        return;
      }
    }
    paint();
    if (window.removeTypingIndicator) window.removeTypingIndicator();
  }

  // ------------------------------------------------------- global overrides

  window.dispatchLogicEngine = function (text) { streamChat(text); };

  // Replaces app.js's version, which waited 1300 ms before dispatching. The
  // typing indicator stays: there is a real wait to cover now, about two
  // seconds on a recommendation and nothing at all on a question.
  window.handleFormSubmit = function (event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const input = $('user-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (!activeChat() && window.createNewChatSession) window.createNewChatSession();
    if (window.dismissSuggestionArc) window.dismissSuggestionArc();
    if (window.appendUserMessage) window.appendUserMessage(val);
    input.value = '';
    if (window.triggerMascotJiggle) window.triggerMascotJiggle();
    if (window.showTypingIndicator) window.showTypingIndicator();
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
