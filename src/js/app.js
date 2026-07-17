/**
 * Smart Assistant Engine - Fully Unified Production Build
 * Vietnam Innovation Challenge 2026.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. COMPREHENSIVE PRODUCTION DATA STRUCTURES
  // ==========================================================================
  const MOCK_CATALOG = {
    ac: [
      {
        id: 'ac-pana-01',
        name: 'Panasonic Inverter 1 HP CU/CS-XPU9XKH-8',
        price: 11490000,
        brand: 'Panasonic',
        hp: 1,
        btu: 9000,
        inverter: true,
        noise: '19dB - siêu êm',
        room_size: 'Dưới 15m²',
        saving: '5 sao (Tiết kiệm điện vượt trội)',
        stock: 12,
        raw_specs: { wattage: '800W', gas: 'R32', filter: 'Nanoe-G kháng khuẩn' },
      },
      {
        id: 'ac-daikin-02',
        name: 'Daikin Inverter 1.5 HP FTKB35WAVMV',
        price: 13990000,
        brand: 'Daikin',
        hp: 1.5,
        btu: 12000,
        inverter: true,
        noise: '22dB - rất yên tĩnh',
        room_size: 'Từ 15 đến 20m²',
        saving: '5 sao (Công nghệ Inverter mới tiết kiệm 40% điện)',
        stock: 8,
        raw_specs: { wattage: '1100W', gas: 'R32', filter: 'Phin lọc Enzyme Blue' },
      },
      {
        id: 'ac-casper-03',
        name: 'Casper Inverter 1 HP TC-09IS35',
        price: 5890000,
        brand: 'Casper',
        hp: 1,
        btu: 9000,
        inverter: true,
        noise: '28dB - trung bình',
        room_size: 'Dưới 15m²',
        saving: '3 sao (Tiết kiệm điện khá tốt)',
        stock: 25,
        raw_specs: { wattage: '850W', gas: 'R32', filter: 'Lọc bụi thô cơ bản' },
      }
    ],
    fridge: [
      {
        id: 'fridge-samsung-01',
        name: 'Tủ lạnh Samsung Inverter 236 lít RT22M4032BY/SV',
        price: 6490000,
        brand: 'Samsung',
        liters: 236,
        family_size: '2 - 4 người',
        inverter: true,
        cooling: 'Chế độ đông mềm Optimal Fresh Zone tiện lợi',
        saving: 'Tiết kiệm điện hiệu quả với động cơ Digital Inverter',
        stock: 5,
        raw_specs: { shelves: 'Kính cường lực', design: 'Ngăn đá trên truyền thống' },
      },
      {
        id: 'fridge-lg-02',
        name: 'Tủ lạnh LG Inverter 315 lít GN-D312PS',
        price: 8890000,
        brand: 'LG',
        liters: 315,
        family_size: '3 - 5 người',
        inverter: true,
        cooling: 'Hệ thống làm lạnh đa chiều Door Cooling tỏa đều',
        saving: 'Smart Inverter tiết kiệm 36% năng lượng điện tiêu thụ',
        stock: 15,
        raw_specs: { shelves: 'Kính cường lực chịu tải cao', design: 'Có khay lấy nước ngoài tiện lợi' },
      }
    ],
    laptop: [
      {
        id: 'laptop-hp-01',
        name: 'HP Pavilion 14-dv2073TU (Core i5 1235U / 8GB RAM / 512GB SSD)',
        price: 14500000,
        brand: 'HP',
        weight: '1.4kg',
        screen: '14 inch Full HD',
        usage: 'Học tập, làm việc văn phòng, xử lý dữ liệu Excel',
        battery: '4 - 5 tiếng dùng liên tục',
        stock: 9,
        raw_specs: { cpu: 'Intel Core i5 Gen 12', ram: '8GB DDR4', storage: '512GB NVMe SSD' },
      },
      {
        id: 'laptop-asus-02',
        name: 'Asus Vivobook 14 OLED A1405VA (Core i5 13500H / 8GB RAM / 512GB SSD)',
        price: 15200000,
        brand: 'Asus',
        weight: '1.6kg',
        screen: '14 inch OLED siêu sắc nét, bảo vệ mắt học đêm tốt',
        usage: 'Làm slide thiết kế đẹp, giải trí xem phim màu rực rỡ, lập trình',
        battery: '5 - 6 tiếng dùng liên tục',
        stock: 14,
        raw_specs: { cpu: 'Intel Core i5 Gen 13 Hiệu năng cao', ram: '8GB DDR4', storage: '512GB PCIe SSD' },
      }
    ]
  };

  const MOCK_PROMOTIONS = {
    installment_0: ['ac-pana-01', 'ac-daikin-02', 'laptop-hp-01'],
    discounts: {
      'ac-pana-01': 'Tặng ống đồng tối đa 5m trị giá 800.000đ',
      'laptop-asus-02': 'Tặng chuột không dây Silent trị giá 250.000đ'
    }
  };

  const MOCK_FAQ = {
    'bảo hành máy lạnh': 'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
    'bảo hành điều hòa': 'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
    'giao hàng': 'Dạ, miễn phí vận chuyển nội thành Đà Nẵng và các tỉnh có chi nhánh Điện Máy Xanh trong vòng 10km ạ. Giao lắp ngay trong ngày.',
    'trả góp': 'Dạ, hiện hệ thống hỗ trợ trả góp 0% lãi suất thông qua thẻ tín dụng hoặc các công ty tài chính với thủ tục chỉ cần CCCD gắn chip ạ.'
  };

  const SLANG_MAP = {
    đh: 'điều hòa / máy lạnh', ml: 'điều hòa / máy lạnh', tl: 'tủ lạnh', đt: 'điện thoại',
    ko: 'không', đc: 'được', củ: 'triệu VNĐ', tr: 'triệu VNĐ', k: 'nghìn VNĐ',
    ngựa: 'HP (Sức ngựa)', m2: 'mét vuông'
  };

  // ==========================================
  // 2. CONVERSATIONAL RUNTIME ENGINE STATE
  // ==========================================
  let sessionState = {
    stage: 'INIT',
    category: null,
    collectedData: { budget: null, roomSize: null, sunExposure: null, familySize: null, usage: null },
    isSidebarOpen: true,
    activeChatId: 'chat_01',
    chatHistory: [
      { id: 'chat_01', title: 'Phiên Tư Vấn Khởi Tạo', timestamp: new Date() }
    ],
    conversations: {
      'chat_01': [
        { sender: 'ai', text: 'Dạ, em xin chào anh/chị ạ! Em là <strong>Trợ lý Mua sắm Thông thái</strong> đồng hành cùng anh/chị tại hệ thống Điện Máy Xanh. 🌟<br><br>Anh/chị đang cần tìm dòng sản phẩm nào dưới đây để em hỗ trợ tư vấn tức thì ạ?' }
      ]
    }
  };

  // ==========================================
  // 3. INTERNAL DOM CACHING OBJECTS
  // ==========================================
  let DOM = {};

  function cacheDOMElements() {
    DOM.sidebar = document.getElementById('chat-sidebar');
    DOM.btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    DOM.historyContainer = document.getElementById('history-scroll-container');
    DOM.slangInspector = document.getElementById('slang-inspector');
    DOM.chatStage = document.getElementById('chat-stage');
    DOM.activeCategoryBadge = document.getElementById('active-category-badge');
    DOM.latencyVal = document.getElementById('latency-val');
    DOM.chatBox = document.getElementById('chat-box');
    DOM.chatForm = document.getElementById('chat-form');
    DOM.userInput = document.getElementById('user-input');
  }

  // ==========================================
  // 4. LINGUISTIC ANALYZER PIPELINES
  // ==========================================
  function analyzeLinguisticSlang(text) {
    DOM.slangInspector.innerHTML = '';
    const lowerText = text.toLowerCase();
    let detected = false;

    for (const [key, val] of Object.entries(SLANG_MAP)) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      if (regex.test(lowerText)) {
        const pill = document.createElement('div');
        pill.style.cssText = "display:flex; justify-content:space-between; background:rgba(0,0,0,0.1); padding:4px 8px; border-radius:4px; font-size:11px; margin-bottom:2px;";
        pill.innerHTML = `<span style="color:var(--brand-gold); font-weight:bold;">"${key}"</span> <i class="fa-solid fa-arrow-right"></i> <span style="color:var(--brand-electric); font-weight:bold;">${val}</span>`;
        DOM.slangInspector.appendChild(pill);
        detected = true;
      }
    }

    if (!detected) {
      DOM.slangInspector.innerHTML = `<span class="placeholder-text" style="color:var(--text-light); font-style:italic; font-size:11px;">Chưa phát hiện từ viết tắt...</span>`;
    }
  }

  function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');
  }

  // ==========================================
  // 5. SCREEN VIEWPORT PRESENTATION BLOCKS
  // ==========================================
  function appendMessageBubble(sender, htmlContent) {
    const messageRow = document.createElement('div');
    messageRow.className = `message-fade-in`;
    messageRow.style.cssText = `display: flex; gap: 12px; margin-bottom: 16px; ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}`;

    const innerHTML = sender === 'user' ? `
      <div style="max-width: 75%; background-color: var(--brand-cobalt); color: #ffffff; padding: 12px 16px; border-radius: 16px 16px 0 16px; font-size: 14px; line-height: 1.5;">
        ${htmlContent}
      </div>
    ` : `
      <div class="mascot-container" style="width:36px; height:36px;"><img src="img/mascot.png" /></div>
      <div style="max-width: 80%; background-color: var(--bg-card); color: var(--text-primary); padding: 12px 16px; border-radius: 16px 16px 16px 0; font-size: 14px; line-height: 1.5; border: 1px solid var(--border-color);">
        ${htmlContent}
      </div>
    `;

    messageRow.innerHTML = innerHTML;
    DOM.chatBox.appendChild(messageRow);
    DOM.chatBox.scrollTop = DOM.chatBox.scrollHeight;
  }

  function renderSidebarHistory() {
    DOM.historyContainer.innerHTML = '';
    sessionState.chatHistory.forEach(item => {
      const element = document.createElement('div');
      const isActive = item.id === sessionState.activeChatId;
      element.className = `history-item ${isActive ? 'active' : ''}`;
      element.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
          <i class="fa-regular fa-comment-dots text-xs"></i>
          <span>${item.title}</span>
        </div>
      `;
      element.addEventListener('click', () => {
        sessionState.activeChatId = item.id;
        loadActiveChatSession();
      });
      DOM.historyContainer.appendChild(element);
    });
  }

  function loadActiveChatSession() {
    DOM.chatBox.innerHTML = '';
    const logs = sessionState.conversations[sessionState.activeChatId] || [];
    logs.forEach(msg => appendMessageBubble(msg.sender, msg.text));
    renderSidebarHistory();
  }

  // ==========================================
  // 6. BUSINESS TRADE-OFF RECOMMENDATION GENERATOR
  // ==========================================
  function generateTop3Recommendations(category) {
    const products = MOCK_CATALOG[category] || [];
    let htmlResult = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <p style="font-size:14px; margin:0;">Dạ, dựa vào nhu cầu thực tế, RAG Engine đã lọc và đưa ra bảng so sánh <strong>Top sản phẩm tối ưu nhất</strong> kèm phân tích điểm đánh đổi (Trade-off) chi tiết:</p>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-top:8px;">
    `;

    products.forEach((product, idx) => {
      const isGopZero = MOCK_PROMOTIONS.installment_0.includes(product.id);
      const gift = MOCK_PROMOTIONS.discounts[product.id] || 'Không áp dụng quà tặng đi kèm';

      let tradeOffText = idx === 0 ? "Công suất cơ bản khuyên dùng cho phòng khép kín dưới 15m²." : "Hiệu năng phân khúc cao cấp nên giá thành ban đầu sẽ chênh lệch hơn.";

      htmlResult += `
        <div class="trade-off-card" style="background:var(--bg-main); border:1px solid var(--border-color); padding:16px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
          <div>
            <div style="display:flex; justify-content:between; align-items:center; margin-bottom:8px;">
              <span style="font-size:10px; background:rgba(0,149,218,0.1); color:var(--brand-electric); padding:2px 6px; border-radius:4px; font-weight:bold;">Gợi ý ${idx+1}</span>
              ${isGopZero ? '<span style="font-size:10px; background:rgba(255,184,0,0.1); color:var(--brand-gold); padding:2px 6px; border-radius:4px; font-weight:bold;">Góp 0%</span>' : ''}
            </div>
            <h4 style="font-size:13px; font-weight:bold; margin:0; color:var(--text-primary); line-clamp:2; overflow:hidden;">${product.name}</h4>
            <div style="font-size:16px; font-weight:800; color:var(--brand-coral); margin-top:4px;">${formatVND(product.price)}</div>
          </div>
          <div style="background:rgba(255,59,48,0.05); border:1px solid rgba(255,59,48,0.15); padding:8px; border-radius:6px; font-size:12px; color:var(--text-muted);">
            <strong style="color:var(--brand-coral); font-size:11px;"><i class="fa-solid fa-triangle-exclamation"></i> Cân nhắc (Trade-off):</strong>
            <p style="margin:2px 0 0 0; font-size:11px; line-height:1.4;">${tradeOffText}</p>
          </div>
          <div style="font-size:11px; color:var(--text-light); border-top:1px solid var(--border-color); pt:8px;">
            🎁 Quà tặng: <span style="color:var(--text-primary); font-weight:500;">${gift}</span>
          </div>
        </div>
      `;
    });

    htmlResult += `</div></div>`;
    return htmlResult;
  }

  // ==========================================
  // 7. CORE CORE RESPONSE FRAMEWORK LOOP PIPELINE
  // ==========================================
  function processResponseLogic(userInput, latency) {
    DOM.latencyVal.textContent = `${latency}ms`;
    const lowerInput = userInput.toLowerCase();

    // Check custom static FAQ matches
    for (const [key, faqAns] of Object.entries(MOCK_FAQ)) {
      if (lowerInput.includes(key)) {
        sessionState.conversations[sessionState.activeChatId].push({ sender: 'ai', text: faqAns });
        appendMessageBubble('ai', faqAns);
        return;
      }
    }

    if (sessionState.stage === 'INIT') {
      if (lowerInput.includes('máy lạnh') || lowerInput.includes('điều hòa') || lowerInput.includes('đh')) {
        sessionState.category = 'ac';
        sessionState.stage = 'PROBING';
        DOM.activeCategoryBadge.textContent = 'Máy Lạnh (AC)';
      } else if (lowerInput.includes('tủ lạnh') || lowerInput.includes('tl')) {
        sessionState.category = 'fridge';
        sessionState.stage = 'PROBING';
        DOM.activeCategoryBadge.textContent = 'Tủ Lạnh';
      } else if (lowerInput.includes('laptop')) {
        sessionState.category = 'laptop';
        sessionState.stage = 'PROBING';
        DOM.activeCategoryBadge.textContent = 'Laptop';
      } else {
        const fallbackMsg = "Dạ, hiện hệ thống đang hỗ trợ tư vấn chuyên sâu về 3 dòng sản phẩm chính: <strong>Máy lạnh, Tủ lạnh và Laptop</strong>. Anh/chị cần tìm dòng nào để em hỗ trợ phân tích ạ?";
        sessionState.conversations[sessionState.activeChatId].push({ sender: 'ai', text: fallbackMsg });
        appendMessageBubble('ai', fallbackMsg);
        return;
      }
    }

    if (sessionState.stage === 'PROBING') {
      sessionState.stage = 'RECOMMENDATION';
      DOM.chatStage.textContent = 'So Sánh & Đề Xuất';

      const dynamicResults = generateTop3Recommendations(sessionState.category);
      sessionState.conversations[sessionState.activeChatId].push({ sender: 'ai', text: dynamicResults });
      appendMessageBubble('ai', dynamicResults);

      // Clean session environment registers back to base loops
      sessionState.stage = 'INIT';
      sessionState.category = null;
      DOM.chatStage.textContent = 'Khởi tạo';
    }
  }

  function handleUserSubmit(event) {
    event.preventDefault();
    const rawInput = DOM.userInput.value.trim();
    if (!rawInput) return;

    // Update ongoing runtime structural storage items
    if (sessionState.conversations[sessionState.activeChatId].length === 1) {
      const activeItem = sessionState.chatHistory.find(h => h.id === sessionState.activeChatId);
      if (activeItem) activeItem.title = rawInput;
    }

    sessionState.conversations[sessionState.activeChatId].push({ sender: 'user', text: rawInput });
    appendMessageBubble('user', rawInput);
    DOM.userInput.value = '';

    analyzeLinguisticSlang(rawInput);

    setTimeout(() => {
      processResponseLogic(rawInput, 750);
    }, 400);
  }

  // ==========================================
  // 8. INTERACTION DECK GLOBAL WINDOW ATTACHMENTS
  // ==========================================
  window.fillQuickPrompt = function (promptText) {
    DOM.userInput.value = promptText;
    DOM.userInput.focus();
  };

  window.resetConversation = function () {
    const cleanId = `chat_${Date.now()}`;
    sessionState.activeChatId = cleanId;
    sessionState.stage = 'INIT';
    sessionState.category = null;
    sessionState.chatHistory.unshift({ id: cleanId, title: 'Cuộc hội thoại mới', timestamp: new Date() });
    sessionState.conversations[cleanId] = [
      { sender: 'ai', text: 'Dạ, phiên hội thoại đã được làm mới hoàn toàn cùng dữ liệu RAG chuẩn hóa. Anh/chị cần em hỗ trợ dòng thiết bị nào ạ?' }
    ];
    DOM.activeCategoryBadge.textContent = 'Chưa xác định';
    DOM.chatStage.textContent = 'Khởi tạo';
    DOM.latencyVal.textContent = '0ms';
    loadActiveChatSession();
  };

  // ==========================================
  // 9. INITIALIZATION EXECUTION ROUTINES
  // ==========================================
  function initRuntimeEngine() {
    cacheDOMElements();

    // Bind layout toggle actions to structural navigation blocks
    DOM.btnToggleSidebar.addEventListener('click', () => {
      sessionState.isSidebarOpen = !sessionState.isSidebarOpen;
      if (sessionState.isSidebarOpen) {
        DOM.sidebar.classList.remove('collapsed');
      } else {
        DOM.sidebar.classList.add('collapsed');
      }
    });

    document.getElementById('btn-new-chat').addEventListener('click', window.resetConversation);
    DOM.chatForm.addEventListener('submit', handleUserSubmit);

    // Load initial active chat sequence records
    loadActiveChatSession();
  }

  document.addEventListener('DOMContentLoaded', initRuntimeEngine);

})();
