/* eslint-disable */
/**
 * Smart Assistant - Trợ Lý Mua Sắm Thông Thái (JS Engine Nâng Cấp Toàn Diện)
 * Bộ điều phối hội thoại thông minh tích hợp bộ trích xuất thực thể (Slot-Filling)
 * Hoàn toàn không cắt xén logic - Sẵn sàng chạy Production Mockup
 */

const MOCK_CATALOG = {
  ac: [
    {
      id: 'ac-pana-01',
      name: 'Panasonic Inverter 1 HP CU/CS-XPU9XKH-8',
      price: 11490000,
      brand: 'Panasonic',
      room_size: 'Dưới 15m²',
      noise: '19dB - siêu êm',
      inverter: true,
      stock: 12,
    },
    {
      id: 'ac-daikin-02',
      name: 'Daikin Inverter 1.5 HP FTKB35WAVMV',
      price: 13990000,
      brand: 'Daikin',
      room_size: 'Từ 15 đến 20m²',
      noise: '22dB - rất yên tĩnh',
      inverter: true,
      stock: 8,
    },
    {
      id: 'ac-casper-03',
      name: 'Casper Inverter 1 HP TC-09IS35',
      price: 5890000,
      brand: 'Casper',
      room_size: 'Dưới 15m²',
      noise: '28dB - trung bình',
      inverter: true,
      stock: 25,
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
      cooling: 'Chế độ đông mềm Optimal Fresh Zone tiện lợi',
      stock: 5,
    },
    {
      id: 'fridge-lg-02',
      name: 'Tủ lạnh LG Inverter 315 lít GN-D312PS',
      price: 8890000,
      brand: 'LG',
      liters: 315,
      family_size: '3 - 5 người',
      cooling: 'Hệ thống làm lạnh đa chiều Door Cooling tỏa đều',
      stock: 15,
    },
    {
      id: 'fridge-aqua-03',
      name: 'Tủ lạnh Aqua 90 lít AQR-D99FA',
      price: 2790000,
      brand: 'Aqua',
      liters: 90,
      family_size: '1 - 2 người (Sinh viên)',
      cooling: 'Làm lạnh trực tiếp bằng mạch khí cơ bản',
      stock: 4,
    }
  ],
  laptop: [
    {
      id: 'laptop-hp-01',
      name: 'HP Pavilion 14-dv2073TU (Core i5 / 8GB RAM / 512GB SSD)',
      price: 14500000,
      brand: 'HP',
      weight: '1.4kg',
      screen: '14 inch Full HD',
      stock: 9,
    },
    {
      id: 'laptop-asus-02',
      name: 'Asus Vivobook 14 OLED (Core i5 / 8GB RAM / 512GB SSD)',
      price: 15200000,
      brand: 'Asus',
      weight: '1.6kg',
      screen: '14 inch OLED siêu sắc nét',
      stock: 14,
    },
    {
      id: 'laptop-lenovo-03',
      name: 'Lenovo IdeaPad Slim 3 (Core i5 / 16GB RAM / 512GB SSD)',
      price: 12900000,
      brand: 'Lenovo',
      weight: '1.43kg',
      screen: '14 inch viền mỏng',
      stock: 22,
    }
  ]
};

const MOCK_PROMOTIONS = {
  installment_0: ['ac-pana-01', 'ac-daikin-02', 'fridge-lg-02'],
  discounts: {
    'ac-pana-01': 'Tặng combo ống đồng vật tư 800.000đ',
    'laptop-asus-02': 'Tặng chuột không dây Bluetooth chính hãng',
    'fridge-lg-02': 'Phiếu mua hàng gia dụng trị giá 300.000đ',
  }
};

const MOCK_FAQ = {
  'bảo hành': 'Dạ, sản phẩm tại Điện Máy Xanh được bảo hành chính hãng 1 đổi 1 trong vòng 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất ạ!',
  'giao hàng': 'Dạ, hệ thống miễn phí vận chuyển lắp đặt trong bán kính 10km quanh siêu thị gần nhất ngay trong ngày ạ.',
  'trả góp': 'Dạ, hiện tại có chương trình hỗ trợ trả góp 0% lãi suất qua căn cước công dân gắn chip cực nhanh chóng, xét duyệt chỉ 5 phút ạ.'
};

const MASCOT_IMAGES = [
  'ChatGPT Image 21_08_20 17 thg 7, 2026 (1).png',
  'ChatGPT Image 21_08_20 17 thg 7, 2026 (2).png',
  'ChatGPT Image 21_08_21 17 thg 7, 2026 (3).png',
  'ChatGPT Image 21_09_41 17 thg 7, 2026 (4).png',
  'ChatGPT Image 21_09_42 17 thg 7, 2026 (5).png',
  'ChatGPT Image 21_09_43 17 thg 7, 2026 (7).png',
  'ChatGPT Image 21_09_43 17 thg 7, 2026 (8).png',
  'ChatGPT Image 21_09_51 17 thg 7, 2026 (10).png',
  'ChatGPT Image 21_18_18 17 thg 7, 2026 (1).png',
  'ChatGPT Image 21_18_19 17 thg 7, 2026 (2).png',
  'ChatGPT Image 21_18_19 17 thg 7, 2026 (3).png',
  'ChatGPT Image 21_18_20 17 thg 7, 2026 (4).png',
  'ChatGPT Image 21_18_21 17 thg 7, 2026 (5).png',
  'ChatGPT Image 21_18_21 17 thg 7, 2026 (6).png',
  'ChatGPT Image 21_18_22 17 thg 7, 2026 (7).png',
  'ChatGPT Image 21_18_22 17 thg 7, 2026 (8).png',
  'ChatGPT Image 21_18_23 17 thg 7, 2026 (9).png'
];

let sessionState = {
  stage: 'INIT', // INIT -> PROBING -> RECOMMENDATION
  category: null, // ac, fridge, laptop
  collectedData: {
    brand: null,
    budget: null, // { modifier: 'dưới'|'trên'|'tầm', value: số }
    roomSize: null, // số m2
    familySize: null, // số thành viên
    purpose: null // học tập, gaming...
  }
};

let consumerChatSessions = [];
let activeSessionId = null;
let historySearchQuery = '';

// ==========================================
// HỆ THỐNG ĐIỀU KHIỂN ĐÓNG/MỞ SIDEBAR
// ==========================================
function initCollapsibleSidebarLogic() {
  const sidebarPanel = document.getElementById('sidebar-panel');
  const btnClose = document.getElementById('btn-close-sidebar');
  const btnOpen = document.getElementById('btn-open-sidebar');

  if (!sidebarPanel || !btnClose || !btnOpen) return;

  btnClose.addEventListener('click', () => {
    sidebarPanel.classList.add('sidebar-collapsed');
    btnOpen.classList.remove('hidden');
  });

  btnOpen.addEventListener('click', () => {
    sidebarPanel.classList.remove('sidebar-collapsed');
    btnOpen.classList.add('hidden');
  });
}

// ==========================================
// Ô TÌM KIẾM LỊCH SỬ TRÊN HEADER
// ==========================================
function initHistorySearch() {
  const input = document.getElementById('history-search');
  if (!input) return;

  input.addEventListener('input', () => {
    historySearchQuery = input.value.trim().toLowerCase();
    renderChatHistoryUI();
  });
}

// ==========================================
// HÀNG "ĐỔI GIAO DIỆN" TRONG THANH BÊN
// ==========================================
function initSidebarThemeToggle() {
  const btn = document.getElementById('side-theme-toggle');
  const pill = document.getElementById('theme-toggle-btn');
  if (!btn || !pill) return;

  btn.addEventListener('click', () => pill.click());
}

// ==========================================
// HIỆU ỨNG RUNG LẮC ĐỒNG LOẠT CHO TOÀN BỘ MASCOT
// ==========================================
function injectJiggleStyles() {
  if (document.getElementById('mascot-jiggle-style')) return;
  const style = document.createElement('style');
  style.id = 'mascot-jiggle-style';
  style.innerHTML = `
    @keyframes jiggleVivid {
      0% { transform: scale(1) rotate(0deg); }
      15% { transform: scale(1.15) rotate(-10deg); }
      30% { transform: scale(1.15) rotate(8deg); }
      45% { transform: scale(1.08) rotate(-6deg); }
      60% { transform: scale(1.08) rotate(4deg); }
      75% { transform: scale(1.02) rotate(-2deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    .animate-jiggle-vivid {
      animation: jiggleVivid 0.6s ease-in-out;
      display: inline-block !important;
    }
  `;
  document.head.appendChild(style);
}

function triggerMascotJiggle() {
  const allMascots = document.querySelectorAll('img[src*="mascot"]');
  allMascots.forEach(mascot => {
    // Không rung jiggle cho phần Header Mascot để dành riêng cho chuyển động violent bounce
    if (mascot.id === 'header-mascot') return;
    mascot.classList.add('animate-jiggle-vivid');
  });
  setTimeout(() => {
    allMascots.forEach(mascot => {
      if (mascot.id === 'header-mascot') return;
      mascot.classList.remove('animate-jiggle-vivid');
    });
  }, 600);
}

window.handleBuyProduct = function() {
  window.appendAssistantMessage('<p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400"><i class="fa-solid fa-circle-check mr-1.5"></i>Dạ tuyệt vời, hệ thống Điện Máy Xanh đã ghi nhận yêu cầu đặt mua sản phẩm của anh/chị! Nhân viên tổng đài sẽ liên hệ hỗ trợ mình sau ít phút ạ.</p>');
  triggerMascotJiggle();

  // KÍCH HOẠT HIỆU ỨNG DI CHUYỂN BẬT NHẢY MẠNH BẠO CHO HEADER MASCOT
  const headerMascot = document.getElementById('header-mascot');
  if (headerMascot) {
    headerMascot.classList.remove('animate-glowing-orb');
    headerMascot.classList.add('animate-violent-bounce');
    setTimeout(() => {
      headerMascot.classList.remove('animate-violent-bounce');
      headerMascot.classList.add('animate-glowing-orb');
    }, 1000);
  }
};

// ==========================================
// UTILITIES & CHAT UI RENDERERS
// ==========================================
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');
}

document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('custom-btn-select')) {
    window.handleBuyProduct();
  }
});

function scrollChatToBottom() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

// INTEGRATED EFFECT: The Liquid Elastic Wave with Glow on typing indicator
function showTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  const html = `
    <div id="typing-indicator" class="flex items-start space-x-3.5 message-fade-in">
      <div class="mascot-avatar w-10 h-10 flex items-center justify-center shrink-0">
        <img src="img/mascot.png" alt="..." class="w-full h-full object-contain animate-mascot-idle" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="sk-bubble sk-edge sk-edge-strong sk-lift bg-paper-50/70 dark:bg-[#1c150c]/60 text-paper-500 px-4 py-3 border border-paper-300/70 dark:border-[#3a2f1c]/50">
        <div class="flex items-center space-x-1.5 py-1">
          <span class="w-2 h-2 bg-paper-500 dark:bg-stone-500 rounded-full typing-dot inline-block"></span>
          <span class="w-2 h-2 bg-paper-500 dark:bg-stone-500 rounded-full typing-dot inline-block"></span>
          <span class="w-2 h-2 bg-paper-500 dark:bg-stone-500 rounded-full typing-dot inline-block"></span>
        </div>
      </div>
    </div>`;
  chatBox.insertAdjacentHTML('beforeend', html);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function appendUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  const html = `
    <div class="flex items-start space-x-3 justify-end message-fade-in">
      <div class="space-y-1 max-w-[80%]">
        <div class="sk-bubble-user sk-edge sk-edge-strong sk-fill-brand sk-lift bg-gradient-to-r from-[#8a4a1c] to-[#c9862f] text-white px-5 py-3 shadow-md">
          <p class="text-sm leading-relaxed">${text}</p>
        </div>
      </div>
      <div class="sk-avatar-alt w-9 h-9 bg-white dark:bg-brand-panel border border-paper-300 dark:border-brand-border flex items-center justify-center shrink-0 shadow-sm">
        <i class="fa-solid fa-user text-brand-electric text-sm"></i>
      </div>
    </div>`;
  chatBox.insertAdjacentHTML('beforeend', html);
  scrollChatToBottom();

  if (activeSessionId) {
    const s = consumerChatSessions.find(item => item.id === activeSessionId);
    if (s) s.messages.push({ role: 'user', content: text });
  }
}

// INTEGRATED EFFECT: The Liquid Elastic Wave with Glow on Assistant Avatar
function appendAssistantMessage(htmlContent) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  const html = `
    <div class="flex items-start space-x-3.5 message-fade-in">
      <div class="mascot-avatar w-10 h-10 flex items-center justify-center shrink-0">
        <img src="img/mascot.png" alt="Avatar" class="w-[85%] h-[85%] object-contain animate-mascot-idle" onerror="this.src='https://placehold.co/100x100?text=AI'">
      </div>
      <div class="space-y-1 max-w-[85%] w-full">
        <div class="sk-bubble sk-edge sk-edge-strong sk-lift bg-paper-50/70 dark:bg-[#1c150c]/60 text-paper-ink dark:text-slate-200 px-5 py-3.5 border border-paper-300/70 dark:border-[#3a2f1c]/50">
          ${htmlContent}
        </div>
      </div>
    </div>`;
  chatBox.insertAdjacentHTML('beforeend', html);
  scrollChatToBottom();

  if (activeSessionId) {
    const s = consumerChatSessions.find(item => item.id === activeSessionId);
    if (s) s.messages.push({ role: 'assistant', content: htmlContent });
  }
}
window.appendAssistantMessage = appendAssistantMessage;

// ==========================================
// QUẢN LÝ LỊCH SỬ PHIÊN TRÒ CHUYỆN (SESSIONS)
// ==========================================
function createNewChatSession(initialTitle = "Cuộc trò chuyện mới") {
  const newId = 'session_' + Date.now();
  const randomMascot = MASCOT_IMAGES[Math.floor(Math.random() * MASCOT_IMAGES.length)];

  const newSession = {
    id: newId,
    title: initialTitle,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    messages: [],
    category: null,
    mascot: randomMascot
  };
  consumerChatSessions.unshift(newSession);
  activeSessionId = newId;
  renderChatHistoryUI();
  return newSession;
}

function updateActiveSessionTitle(newTitle, categoryCode) {
  if (!activeSessionId) return;
  const s = consumerChatSessions.find(item => item.id === activeSessionId);
  if (s) {
    s.title = newTitle;
    if (categoryCode) s.category = categoryCode;
    renderChatHistoryUI();
  }
}

function renderChatHistoryUI() {
  const container = document.getElementById('chat-history-list');
  if (!container) return;

  const visibleSessions = historySearchQuery
    ? consumerChatSessions.filter(s => (s.title || '').toLowerCase().includes(historySearchQuery))
    : consumerChatSessions;

  if (visibleSessions.length === 0) {
    const message = historySearchQuery
      ? `Không tìm thấy cuộc trò chuyện nào khớp “${historySearchQuery}”.`
      : 'Chưa có cuộc trò chuyện nào.';
    container.innerHTML = `
      <div id="history-empty-state" class="px-3 py-6">
        <p class="text-[11.5px] text-paper-inksoft/70 dark:text-stone-500">${message}</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  visibleSessions.forEach((session) => {
    const isActive = session.id === activeSessionId;
    const pill = document.createElement('div');

    pill.className = `side-chat history-item-appear${isActive ? ' is-active' : ''}`;
    pill.title = session.title;

    // Linh vật ngẫu nhiên của phiên: ảnh trần, không đĩa nền hay khung viền,
    // chỉ có quầng sáng để không chìm vào nền tối.
    const mascotFile = session.mascot || 'mascot.png';
    pill.innerHTML = `
      <img src="img/${mascotFile}" alt="" aria-hidden="true"
           class="side-chat-mascot mascot-glow" onerror="this.src='img/mascot.png'">
      <span>${session.title}</span>`;

    pill.addEventListener('click', () => {
      activeSessionId = session.id;
      renderChatHistoryUI();
      restoreSessionMessages(session);
    });
    container.appendChild(pill);
  });
}

function restoreSessionMessages(session) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;

  if (!session.messages || session.messages.length === 0) {
    // Phiên còn trống thì dải gợi ý vẫn hữu ích, cho nó trở lại.
    restoreSuggestionArc();

    chatBox.innerHTML = `
      <div class="flex items-start space-x-3.5 message-fade-in">
        <div class="mascot-avatar w-10 h-10 flex items-center justify-center shrink-0">
          <img src="img/mascot.png" alt="Avatar" class="w-[85%] h-[85%] object-contain animate-mascot-idle" onerror="this.src='https://placehold.co/100x100?text=AI'">
        </div>
        <div class="space-y-1 max-w-[85%] w-full">
          <div class="sk-bubble sk-edge sk-edge-strong sk-lift bg-paper-50/70 dark:bg-[#1c150c]/60 text-paper-ink dark:text-slate-200 px-5 py-3.5 border border-paper-300/70 dark:border-[#3a2f1c]/50">
            <p class="text-sm">Dạ, phiên hội thoại tư vấn mua sắm mới đã sẵn sàng phục vụ rồi ạ! Anh/chị cần em hỗ trợ tìm kiếm dòng thiết bị công nghệ điện máy nào thế ạ?</p>
          </div>
        </div>
      </div>`;
    sessionState.stage = 'INIT';
    sessionState.category = null;
    sessionState.collectedData = { brand: null, budget: null, roomSize: null, familySize: null, purpose: null };

    document.getElementById('active-category').textContent = 'Chưa xác định';
    document.getElementById('chat-stage').textContent = 'INIT';
    scrollChatToBottom();
    return;
  }

  // Phiên đã có tin nhắn: gợi ý biến mất ngay, khỏi bay lượn lại từ đầu.
  hideSuggestionArcNow();

  chatBox.innerHTML = '';
  session.messages.forEach(msg => {
    if (msg.role === 'user') {
      const html = `<div class="flex items-start space-x-3 justify-end message-fade-in"><div class="sk-bubble-user sk-edge sk-edge-strong sk-fill-brand sk-lift max-w-[80%] bg-gradient-to-r from-[#8a4a1c] to-[#c9862f] text-white px-5 py-3 text-[13.5px] shadow-sm">${msg.content}</div></div>`;
      chatBox.insertAdjacentHTML('beforeend', html);
    } else {
      const html = `<div class="flex items-start space-x-3.5 message-fade-in"><div class="mascot-avatar w-10 h-10 flex items-center justify-center shrink-0"><img src="img/mascot.png" class="w-[85%] h-[85%] object-contain animate-mascot-idle"></div><div class="sk-bubble sk-edge sk-edge-strong sk-lift max-w-[85%] w-full bg-paper-50/70 dark:bg-[#1c150c]/60 text-paper-ink dark:text-slate-200 px-5 py-3.5 border border-paper-300/70 dark:border-[#3a2f1c]/50 text-[13.5px]">${msg.content}</div></div>`;
      chatBox.insertAdjacentHTML('beforeend', html);
    }
  });

  sessionState.category = session.category;
  sessionState.stage = session.messages.length > 0 ? 'RECOMMENDATION' : 'INIT';
  document.getElementById('active-category').textContent = session.category || 'Chưa xác định';
  document.getElementById('chat-stage').textContent = sessionState.stage;
  scrollChatToBottom();
}

// ========================================================
// HEURISTIC NLP PARSER - TRÍCH XUẤT THÔNG TIN TỰ NHIÊN TIẾNG VIỆT
// ========================================================
function extractEntitiesFromText(text) {
  const lower = text.toLowerCase();
  let result = {};

  if (lower.includes('máy lạnh') || lower.includes('điều hòa') || lower.includes('đh')) {
    result.category = 'ac';
  } else if (lower.includes('tủ lạnh') || lower.includes('tl')) {
    result.category = 'fridge';
  } else if (lower.includes('laptop') || lower.includes('máy tính')) {
    result.category = 'laptop';
  }

  const brandsList = ['panasonic', 'daikin', 'casper', 'samsung', 'lg', 'aqua', 'hp', 'asus', 'lenovo'];
  for (const b of brandsList) {
    if (lower.includes(b)) {
      result.brand = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }
  if (!result.brand && lower.includes('pana')) result.brand = 'Panasonic';

  const priceRegex = /(dưới|trên|tầm|khoảng|~)?\s*(\d+)\s*(triệu|tr|củ)/i;
  const matchPrice = lower.match(priceRegex);
  if (matchPrice) {
    const modifier = matchPrice[1] || 'tầm';
    const numericValue = parseInt(matchPrice[2], 10) * 1000000;
    result.budget = { modifier, value: numericValue };
  }

  const roomRegex = /(\d+)\s*(m2|m²)/i;
  const matchRoom = lower.match(roomRegex);
  if (matchRoom) {
    result.roomSize = parseInt(matchRoom[1], 10);
  } else if (lower.includes('phòng ngủ')) {
    result.roomSize = 12;
  } else if (lower.includes('phòng khách')) {
    result.roomSize = 22;
  }

  const familyRegex = /(\d+)\s*(người|thành viên|nhân khẩu)/i;
  const matchFamily = lower.match(familyRegex);
  if (matchFamily) {
    result.familySize = parseInt(matchFamily[1], 10);
  } else if (lower.includes('sinh viên') || lower.includes('ở một mình') || lower.includes('trọ')) {
    result.familySize = 1;
  }

  if (lower.includes('sinh viên') || lower.includes('học tập') || lower.includes('văn phòng') || lower.includes('mỏng nhẹ')) {
    result.purpose = 'office';
  } else if (lower.includes('gaming') || lower.includes('đồ họa') || lower.includes('chơi game')) {
    result.purpose = 'heavy';
  }

  return result;
}

// ========================================================
// CORE LOGIC ENGINE - ĐIỀU PHỐI HỘI THOẠI & DỮ LIỆU RAG
// ========================================================
function handleFormSubmit(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const input = document.getElementById('user-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!activeSessionId) createNewChatSession();

  // Câu đầu tiên là lúc dải gợi ý rút lui, trả lại 100px cuối khung chat.
  dismissSuggestionArc();

  appendUserMessage(val);
  input.value = '';
  showTypingIndicator();

  // FIX: Tăng thời gian chờ lên 1.3 giây để vòng lặp animation kịp diễn ra trọn vẹn
  setTimeout(() => {
    removeTypingIndicator();
    dispatchLogicEngine(val);
  }, 1300);
}
function dispatchLogicEngine(text) {
  const startTime = performance.now();
  const lower = text.toLowerCase();

  for (const [key, answer] of Object.entries(MOCK_FAQ)) {
    if (lower.includes(key)) {
      document.getElementById('rag-faq-status').textContent = `Khớp FAQ: [${key}]`;
      document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
      appendAssistantMessage(`<p class="text-sm"><i class="fa-solid fa-circle-info text-brand-electric mr-1.5"></i>${answer}</p>`);
      return;
    }
  }
  document.getElementById('rag-faq-status').textContent = 'Không khớp FAQ';

  const extracted = extractEntitiesFromText(text);

  if (extracted.category) sessionState.category = extracted.category;
  if (extracted.brand) sessionState.collectedData.brand = extracted.brand;
  if (extracted.budget) sessionState.collectedData.budget = extracted.budget;
  if (extracted.roomSize) sessionState.collectedData.roomSize = extracted.roomSize;
  if (extracted.familySize) sessionState.collectedData.familySize = extracted.familySize;
  if (extracted.purpose) sessionState.collectedData.purpose = extracted.purpose;

  document.getElementById('active-category').textContent = sessionState.category || 'Chưa xác định';
  document.getElementById('slang-inspector').textContent = JSON.stringify(sessionState.collectedData);

  if (!sessionState.category) {
    sessionState.stage = 'INIT';
    document.getElementById('chat-stage').textContent = sessionState.stage;
    document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
    appendAssistantMessage('<p class="text-sm">Dạ, em có thể hỗ trợ tư vấn chuyên sâu và so sánh thông thái về 3 nhóm sản phẩm: <strong>Máy lạnh, Tủ lạnh, hoặc Laptop</strong>. Anh/chị đang có nhu cầu tìm mua sản phẩm nào ạ?</p>');
    return;
  }

  let categoryLabel = "Trò chuyện";
  if (sessionState.category === 'ac') categoryLabel = "Tư vấn Máy Lạnh";
  if (sessionState.category === 'fridge') categoryLabel = "Tư vấn Tủ Lạnh";
  if (sessionState.category === 'laptop') categoryLabel = "Tư vấn Laptop";
  updateActiveSessionTitle(categoryLabel, sessionState.category);

  if (sessionState.category === 'ac' && !sessionState.collectedData.roomSize) {
    if (sessionState.stage === 'PROBING') {
      sessionState.collectedData.roomSize = 12;
      appendAssistantMessage('<p class="text-xs italic text-paper-500 mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Em xin phép lấy mức diện tích phòng ngủ tiêu chuẩn phổ thông (dưới 15m²) để lọc sản phẩm ngay cho mình nhé.</p>');
    } else {
      sessionState.stage = 'PROBING';
      document.getElementById('chat-stage').textContent = sessionState.stage;
      document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
      appendAssistantMessage('<p class="text-sm">Dạ, để em tính toán công suất số Ngựa (HP) tối ưu nhất, anh/chị cho em hỏi <strong>diện tích phòng lắp đặt khoảng bao nhiêu m²</strong> (hoặc lắp cho không gian nào như phòng ngủ, phòng khách) ạ?</p>');
      return;
    }
  }

  if (sessionState.category === 'fridge' && !sessionState.collectedData.familySize) {
    if (sessionState.stage === 'PROBING') {
      sessionState.collectedData.familySize = 3;
      appendAssistantMessage('<p class="text-xs italic text-paper-500 mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Em xin phép lấy dung tích tiêu chuẩn cho hộ gia đình 3 - 4 thành viên phổ biến để đề xuất các mẫu tối ưu nhé.</p>');
    } else {
      sessionState.stage = 'PROBING';
      document.getElementById('chat-stage').textContent = sessionState.stage;
      document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
      appendAssistantMessage('<p class="text-sm">Dạ, nhà mình dự kiến **có khoảng bao nhiêu thành viên** sẽ dùng chung tủ lạnh ạ, để em lọc mức dung tích (lít) chứa thực phẩm vừa vặn nhất cho gia đình mình?</p>');
      return;
    }
  }

  if (sessionState.category === 'laptop' && !sessionState.collectedData.brand && !sessionState.collectedData.budget) {
    if (sessionState.stage !== 'PROBING') {
      sessionState.stage = 'PROBING';
      document.getElementById('chat-stage').textContent = sessionState.stage;
      document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
      appendAssistantMessage('<p class="text-sm">Dạ, anh/chị tìm mua laptop phục vụ chính cho **nhu cầu học tập văn phòng mỏng nhẹ** hay **đồ họa chơi game nặng** ạ? Nếu mình có khoảng ngân sách dự kiến, hãy chia sẻ để em định hình máy chuẩn nhất nha!</p>');
      return;
    }
  }

  sessionState.stage = 'RECOMMENDATION';
  document.getElementById('chat-stage').textContent = sessionState.stage;

  const catalog = MOCK_CATALOG[sessionState.category];
  let filteredProducts = [...catalog];

  if (sessionState.collectedData.brand) {
    const targetBrand = sessionState.collectedData.brand.toLowerCase();
    filteredProducts = filteredProducts.filter(p => p.brand.toLowerCase().includes(targetBrand));
  }

  if (sessionState.collectedData.budget) {
    const { modifier, value } = sessionState.collectedData.budget;
    if (modifier === 'dưới') {
      filteredProducts = filteredProducts.filter(p => p.price <= value);
    } else if (modifier === 'trên') {
      filteredProducts = filteredProducts.filter(p => p.price >= value);
    } else {
      filteredProducts = filteredProducts.filter(p => p.price <= value * 1.15);
    }
  }

  if (sessionState.category === 'ac' && sessionState.collectedData.roomSize) {
    const size = sessionState.collectedData.roomSize;
    if (size <= 15) {
      filteredProducts = filteredProducts.filter(p => p.room_size.includes('Dưới 15m²'));
    } else {
      filteredProducts = filteredProducts.filter(p => p.room_size.includes('15 đến 20m²'));
    }
  }

  if (sessionState.category === 'fridge' && sessionState.collectedData.familySize) {
    const size = sessionState.collectedData.familySize;
    if (size <= 2) {
      filteredProducts = filteredProducts.filter(p => p.family_size.includes('1 - 2') || p.family_size.includes('2 - 4'));
    } else if (size >= 3 && size <= 4) {
      filteredProducts = filteredProducts.filter(p => p.family_size.includes('2 - 4') || p.family_size.includes('3 - 5'));
    } else {
      filteredProducts = filteredProducts.filter(p => p.family_size.includes('3 - 5'));
    }
  }

  let isFallbackTriggered = false;
  if (filteredProducts.length === 0) {
    filteredProducts = [...catalog];
    isFallbackTriggered = true;
  }

  document.getElementById('rag-catalog-status').textContent = `Tìm thấy ${filteredProducts.length} mẫu`;
  document.getElementById('rag-promo-status').textContent = 'Đã áp mã khuyến mãi dynamic';

  let introductionPrompt = "";
  if (isFallbackTriggered) {
    introductionPrompt = `Dạ hiện tại kho hàng không có mẫu nào khớp hoàn hảo 100% tiêu chí đặc thù trên, em xin phép đề xuất **Top ${filteredProducts.length} sản phẩm bán chạy nhất** thuộc nhóm ngành hàng này tại Điện Máy Xanh để anh/chị cân nhắc ạ:`;
  } else {
    introductionPrompt = `Dạ tuyệt vời! Khảo sát kho hàng thời gian thực, em đã tìm thấy **${filteredProducts.length} sản phẩm tối ưu nhất** phù hợp hoàn chỉnh với mong muốn của mình. Dưới đây là phân tích đặc tính kỹ thuật kèm điểm đánh đổi thực tế:`;
  }

  let cardsHtml = `<p class="text-[13.5px] leading-relaxed mb-4 text-paper-ink dark:text-slate-200">${introductionPrompt}</p>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

  filteredProducts.forEach((product, idx) => {
    const hasZeroInstallment = MOCK_PROMOTIONS.installment_0.includes(product.id);
    const promotionGift = MOCK_PROMOTIONS.discounts[product.id] || 'Tặng phiếu mua hàng trị giá 200.000đ (Áp dụng mua đồ gia dụng)';

    let tradeOffAnalysis = "Dòng sản phẩm quốc dân, lượng đặt mua rất cao dễ gặp tình trạng thiếu hàng cục bộ tại một số quận huyện.";
    if (product.price < 6000000) {
      tradeOffAnalysis = "Giá thành siêu rẻ tiết kiệm chi phí, tuy nhiên tính năng chỉ dừng ở mức cơ bản, không tích hợp nhiều công nghệ cảm biến cao cấp.";
    } else if (product.price > 13000000) {
      tradeOffAnalysis = "Công nghệ và độ bền xuất sắc hàng đầu, tuy nhiên tổng chi phí đầu tư ban đầu sẽ cao hơn các thương hiệu phổ thông.";
    }

    let specsHtml = "";
    if (sessionState.category === 'ac') {
      specsHtml = `<li><i class="fa-solid fa-expand text-paper-400 mr-1.5"></i>Diện tích: <strong>${product.room_size}</strong></li>
                   <li><i class="fa-solid fa-volume-low text-paper-400 mr-1.5"></i>Độ ồn: <strong>${product.noise}</strong></li>`;
    } else if (sessionState.category === 'fridge') {
      specsHtml = `<li><i class="fa-solid fa-box-open text-paper-400 mr-1.5"></i>Dung tích: <strong>${product.liters} Lít</strong></li>
                   <li><i class="fa-solid fa-snowflake text-paper-400 mr-1.5"></i>Làm lạnh: <strong>${product.family_size}</strong></li>`;
    } else if (sessionState.category === 'laptop') {
      specsHtml = `<li><i class="fa-solid fa-weight-hanging text-paper-400 mr-1.5"></i>Trọng lượng: <strong>${product.weight}</strong></li>
                   <li><i class="fa-solid fa-laptop text-paper-400 mr-1.5"></i>Màn hình: <strong>${product.screen}</strong></li>`;
    }

    cardsHtml += `
      <div class="sk-edge sk-lift sk-fill-amber ${idx % 2 === 0 ? 'sk-card' : 'sk-card-alt sk-edge-alt'} bg-amber-50/60 dark:bg-amber-950/20 p-4 border border-amber-200/80 dark:border-amber-500/20 flex flex-col justify-between space-y-3.5 shadow-sm transition-all hover:shadow-md hover:border-amber-400/80">
        <div>
          <div class="flex items-center justify-between">
            <span class="sk-badge sk-edge sk-edge-soft sk-edge-single sk-fill-accent px-2.5 py-0.5 text-[10px] font-bold bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">Đề xuất ${idx + 1}</span>
            ${hasZeroInstallment ? `<span class="sk-badge sk-edge sk-edge-soft sk-edge-single sk-fill-none px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"><i class="fa-solid fa-bolt text-[8px]"></i> Trả góp 0%</span>` : ''}
          </div>
          <h3 class="font-bold text-[12.5px] text-paper-ink dark:text-white mt-2 line-clamp-2 h-9 leading-snug">${product.name}</h3>
          <div class="text-[15px] font-extrabold text-[#8a4a1c] dark:text-brand-electric mt-1.5">${formatVND(product.price)}</div>

          <ul class="sk-panel sk-edge sk-edge-soft sk-edge-single sk-fill-paper-2 text-[11px] text-paper-inksoft dark:text-stone-400 mt-2.5 space-y-1 bg-paper-50/60 dark:bg-black/20 p-3 border border-amber-100 dark:border-brand-border/30">
            ${specsHtml}
          </ul>

          <p class="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-2.5 flex items-start"><i class="fa-solid fa-gift mr-1.5 mt-0.5 text-xs shrink-0"></i><span>Quà tặng: ${promotionGift}</span></p>
        </div>

        <div class="sk-panel sk-edge sk-edge-soft sk-edge-single sk-fill-paper-2 bg-white dark:bg-amber-900/20 p-3 text-[11px] text-amber-900 dark:text-amber-400 border border-amber-200/60 leading-relaxed">
          <strong>Điểm đánh đổi (Trade-off):</strong> ${tradeOffAnalysis}
        </div>

        <button class="sk-pill sk-edge sk-edge-strong sk-lift w-full custom-btn-select text-xs py-2.5 font-bold transition-all shadow-sm">Đặt Mua Ngay</button>
      </div>`;
  });

  cardsHtml += `</div>`;
  appendAssistantMessage(cardsHtml);

  sessionState.stage = 'INIT';
  sessionState.category = null;
  sessionState.collectedData = { brand: null, budget: null, roomSize: null, familySize: null, purpose: null };

  document.getElementById('chat-stage').textContent = sessionState.stage;
  document.getElementById('latency-val').textContent = Math.round(performance.now() - startTime) + 'ms';
}

// ==========================================
// CÁC HÀM KHỞI TẠO VÀ LÀM MỚI PHIÊN
// ==========================================
window.resetConversation = function() {
  if (activeSessionId) {
    const currentSession = consumerChatSessions.find(item => item.id === activeSessionId);
    if (currentSession && (!currentSession.messages || currentSession.messages.length === 0)) {
      return;
    }
  }

  const newestEmptySession = consumerChatSessions.find(session => !session.messages || session.messages.length === 0);

  // Màn hình lại trống, nên dải gợi ý quay về giúp khách có chỗ bắt đầu.
  restoreSuggestionArc();

  if (newestEmptySession) {
    activeSessionId = newestEmptySession.id;
    restoreSessionMessages(newestEmptySession);

    document.getElementById('slang-inspector').textContent = '';
    document.getElementById('rag-catalog-status').textContent = '';
    document.getElementById('rag-promo-status').textContent = '';
    document.getElementById('rag-faq-status').textContent = '';

    renderChatHistoryUI();
  } else {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
      chatBox.innerHTML = `
        <div class="flex items-start space-x-3.5 message-fade-in">
          <div class="mascot-avatar w-10 h-10 flex items-center justify-center shrink-0">
            <img src="img/mascot.png" alt="Avatar" class="w-[85%] h-[85%] object-contain animate-mascot-idle" onerror="this.src='https://placehold.co/100x100?text=AI'">
          </div>
          <div class="space-y-1 max-w-[85%] w-full">
            <div class="sk-bubble sk-edge sk-edge-strong sk-lift bg-paper-50/70 dark:bg-[#1c150c]/60 text-paper-ink dark:text-slate-200 px-5 py-3.5 border border-paper-300/70 dark:border-[#3a2f1c]/50">
              <p class="text-sm">Dạ, phiên hội thoại tư vấn mua sắm mới đã sẵn sàng phục vụ rồi ạ! Anh/chị cần em hỗ trợ tìm kiếm dòng thiết bị công nghệ điện máy nào thế ạ?</p>
            </div>
          </div>
        </div>`;
    }

    sessionState.stage = 'INIT';
    sessionState.category = null;
    sessionState.collectedData = { brand: null, budget: null, roomSize: null, familySize: null, purpose: null };

    document.getElementById('active-category').textContent = 'Chưa xác định';
    document.getElementById('chat-stage').textContent = 'INIT';
    document.getElementById('slang-inspector').textContent = '';
    document.getElementById('rag-catalog-status').textContent = '';
    document.getElementById('rag-promo-status').textContent = '';
    document.getElementById('rag-faq-status').textContent = '';

    createNewChatSession();
  }
};

// ==========================================
// BĂNG CHUYỀN GỢI Ý NHANH
// Mười viên gợi ý bay vòng cung trên ô nhập liệu. Đường bay, thứ tự màu và việc
// dừng lại khi rê chuột đều do CSS lo (@keyframes sk-suggest-orbit +
// animation-play-state). Mỗi câu trong data-prompt đều chứa từ khoá mà
// parseUserIntent() đã nhận diện sẵn (máy lạnh/điều hòa/đh, tủ lạnh, laptop,
// hãng, phòng ngủ/phòng khách, sinh viên, gaming, mức giá) nên không cần thêm
// luồng trả lời mới.
//
// Phần JS dưới đây chỉ lo MỘT việc: khi con trỏ nằm trên vòng cung, băng chuyền
// đứng lại và quay theo hướng di chuyển của chuột — kéo sang phải thì đi tới,
// kéo sang trái thì lùi lại.
// ==========================================

const SUGGEST_CYCLE = 56;        // khớp với animation-duration trong main.css
const SUGGEST_STAGGER = 5.6;     // SUGGEST_CYCLE / 10, độ lệch pha giữa hai viên
const SUGGEST_SCRUB_DEADZONE = 3; // px: chống rung tay làm viên trượt khỏi con trỏ

function initSuggestionScrub() {
  const arc = document.getElementById('suggest-arc');
  if (!arc) return;

  const pills = Array.from(arc.querySelectorAll('.sk-suggest-pill'));
  if (pills.length === 0) return;

  // Chế độ giảm chuyển động: vòng cung đứng yên, không có gì để kéo.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Vị trí hiện tại của cả băng chuyền trên dòng thời gian 56s. Giữ nguyên giữa
  // các lần rê chuột nên thả tay ra là chạy tiếp từ đúng chỗ đó.
  let phase = 0;
  let lastX = null;
  let travelled = 0;   // tổng quãng đường đã rê, để vượt vùng chết mới bắt đầu kéo
  let secPerPx = 0;
  let frame = 0;

  // Hoạt ảnh đang tạm dừng thì animation-delay âm chính là "tua" tới thời điểm
  // bất kỳ trong chu kỳ — kéo tới hay lùi lại đều được, và dùng lại đúng
  // @keyframes của CSS nên không phải chép lại hình học vòng cung sang JS.
  function render() {
    frame = 0;
    pills.forEach((pill, i) => {
      const at = ((phase + i * SUGGEST_STAGGER) % SUGGEST_CYCLE + SUGGEST_CYCLE) % SUGGEST_CYCLE;
      pill.style.animationDelay = `-${at.toFixed(3)}s`;
    });
  }

  arc.addEventListener('mouseenter', (e) => {
    // Rê hết bề ngang vòng cung = băng chuyền đi trọn một lượt (nửa chu kỳ,
    // vì nửa sau là lúc viên đang "đỗ" ngoài mép phải).
    const width = arc.getBoundingClientRect().width || 1;
    secPerPx = (SUGGEST_CYCLE / 2) / width;
    lastX = e.clientX;
    travelled = 0;
  });

  arc.addEventListener('mousemove', (e) => {
    if (lastX === null) return;

    const dx = e.clientX - lastX;
    lastX = e.clientX;

    travelled += Math.abs(dx);
    if (travelled < SUGGEST_SCRUB_DEADZONE) return;

    phase += dx * secPerPx;
    if (!frame) frame = requestAnimationFrame(render);
  });

  arc.addEventListener('mouseleave', () => {
    lastX = null;
    // Ghi lại vị trí lần cuối rồi để CSS chạy tiếp — không giật về chỗ cũ.
    if (frame) { cancelAnimationFrame(frame); }
    render();
  });
}

// ------------------------------------------------------------------
// TAN BIẾN KHI KHÁCH GỬI TIN NHẮN ĐẦU TIÊN
//
// Dải gợi ý chiếm cố định 100px ngay trên ô nhập liệu — lúc chưa có gì để đọc
// thì đẹp, nhưng khi cuộc trò chuyện dài ra thì nó che mất phần cuối. Nên câu
// đầu tiên khách gửi cũng là lúc dải này rút lui: các viên đang bay bị hút về
// một điểm ngay dưới ô nhập liệu, nhỏ dần rồi tắt, sau đó khung co lại còn 0
// để khung chat lấy lại đúng 100px đó.
//
// Mẹo ở đây: trước khi bay, mỗi viên được chuyển sang position:fixed tại đúng
// toạ độ đang đứng. Nhờ vậy viên thoát khỏi overflow:hidden của khung (không bị
// cắt giữa đường) và cũng không còn dính vào layout, nên khung co lại bao nhiêu
// cũng không xê dịch đường bay.
// ------------------------------------------------------------------

const SUGGEST_FLIGHT = 620;      // ms: thời gian một viên bay tới tiêu điểm
const SUGGEST_FLIGHT_STAGGER = 45; // ms: viên bên trái đi trước, tạo vệt kéo
let suggestArcDismissed = false;
let suggestArcTimers = [];       // hẹn giờ của lần bay đang diễn ra, để còn huỷ

function dismissSuggestionArc() {
  if (suggestArcDismissed) return;
  suggestArcDismissed = true;

  const arc = document.getElementById('suggest-arc');
  if (!arc || arc.hidden) return;

  const reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Giảm chuyển động: bỏ luôn, không bay lượn gì cả.
  if (reduceMotion) {
    arc.hidden = true;
    return;
  }

  // Tiêu điểm: chính giữa ô nhập liệu, ngay mép trên — các viên chụm xuống như
  // bị ô nhập liệu hút vào.
  const form = document.getElementById('chat-form');
  const arcRect = arc.getBoundingClientRect();
  const formRect = form ? form.getBoundingClientRect() : null;
  const focalX = formRect ? formRect.left + formRect.width / 2 : arcRect.left + arcRect.width / 2;
  const focalY = formRect ? formRect.top : arcRect.bottom;

  // Đo TRƯỚC khi đổi gì — getBoundingClientRect lúc này trả về vị trí thật của
  // viên giữa chừng hoạt hình, đúng chỗ mắt khách đang thấy.
  //
  // Chỉ những viên ĐANG THẤY mới cần bay. Số còn lại đang "đỗ" ngoài mép phải
  // với opacity 0, hoặc bị màn hình hẹp ẩn đi (display:none, kích thước bằng 0)
  // — giữ chúng lại trong danh sách thì chúng chiếm mất các nhịp lệch pha đầu và
  // những viên thấy được sẽ khởi hành trễ một cách vô cớ.
  const flights = [];
  arc.querySelectorAll('.sk-suggest-pill').forEach(pill => {
    const rect = pill.getBoundingClientRect();
    const opacity = parseFloat(window.getComputedStyle(pill).opacity) || 0;

    if (rect.width > 0 && opacity >= 0.01) {
      flights.push({ pill, rect, opacity });
    } else {
      pill.style.display = 'none';
    }
  });

  // Viên bên trái khởi hành trước để cả dải chụm lại thành một vệt, thay vì mười
  // viên cùng lao vào một điểm.
  flights.sort((a, b) => a.rect.left - b.rect.left);

  // Lượt 1 — đóng băng mọi viên tại chỗ: bỏ hoạt hình quỹ đạo, chuyển sang fixed
  // theo đúng toạ độ vừa đo. Nhờ fixed, viên thoát khỏi overflow:hidden của khung
  // nên không bị cắt giữa đường, và khung có co lại cũng không kéo theo nó.
  flights.forEach(({ pill, rect, opacity }) => {
    pill.style.animation = 'none';
    pill.style.position = 'fixed';
    pill.style.left = `${rect.left}px`;
    pill.style.top = `${rect.top}px`;
    pill.style.width = `${rect.width}px`;
    pill.style.margin = '0';
    pill.style.transform = 'none';
    pill.style.opacity = String(opacity);
    pill.style.pointerEvents = 'none';
  });

  // Khung cũng chốt chiều cao hiện tại làm mốc để lát nữa co về 0.
  arc.style.height = `${arcRect.height}px`;

  // Một lần đọc layout duy nhất, chốt toàn bộ trạng thái "đóng băng" ở trên làm
  // mốc khởi hành. Thiếu nhịp này trình duyệt gộp luôn với trạng thái đích và
  // các viên nhảy cóc tới tiêu điểm thay vì bay.
  void arc.offsetWidth;

  // Lượt 2 — thả cho bay.
  flights.forEach(({ pill, rect }, i) => {
    const dx = focalX - (rect.left + rect.width / 2);
    const dy = focalY - (rect.top + rect.height / 2);
    const delay = i * SUGGEST_FLIGHT_STAGGER;

    pill.style.transition = `transform ${SUGGEST_FLIGHT}ms cubic-bezier(0.55, 0.06, 0.3, 1) ${delay}ms, `
      + `opacity ${SUGGEST_FLIGHT}ms cubic-bezier(0.5, 0, 0.85, 0.4) ${delay}ms`;
    pill.style.transform = `translate(${dx}px, ${dy}px) scale(0.24)`;
    pill.style.opacity = '0';
  });

  const lastDelay = Math.max(0, flights.length - 1) * SUGGEST_FLIGHT_STAGGER;

  // Khung co lại ngay sau khi các viên rời đi — viên đang fixed nên không hề bị
  // ảnh hưởng, còn khung chat thì nở ra bù đúng chỗ trống.
  arc.classList.add('is-dismissing');
  suggestArcTimers.push(window.setTimeout(() => {
    arc.style.height = '0px';
    arc.style.marginBottom = '0px';
  }, 180));

  // Bay xong thì giấu hẳn khỏi cây layout (và khỏi bàn phím / trình đọc màn hình).
  suggestArcTimers.push(window.setTimeout(() => {
    arc.hidden = true;
  }, SUGGEST_FLIGHT + lastDelay + 220));
}

// Phiên mới = quay lại màn hình trống, nên dải gợi ý cũng trở lại. Gỡ sạch style
// nội tuyến đã gán lúc bay để CSS cầm lái quỹ đạo như ban đầu.
function restoreSuggestionArc() {
  const arc = document.getElementById('suggest-arc');
  if (!arc) return;

  // Khách bấm "phiên mới" ngay khi các viên còn đang bay: huỷ hẹn giờ của lần bay
  // đó, nếu không cái lệnh `arc.hidden = true` cuối hành trình sẽ nổ sau lưng và
  // giấu mất dải gợi ý vừa dựng lại.
  suggestArcTimers.forEach(window.clearTimeout);
  suggestArcTimers = [];

  suggestArcDismissed = false;
  arc.hidden = false;
  arc.classList.remove('is-dismissing');
  arc.style.height = '';
  arc.style.marginBottom = '';

  arc.querySelectorAll('.sk-suggest-pill').forEach(pill => {
    pill.removeAttribute('style');
  });
}

// Mở lại một phiên đã có nội dung: dải gợi ý phải biến mất ngay, không bay lượn
// — cuộc trò chuyện đó đã qua giai đoạn cần gợi ý từ lâu rồi.
function hideSuggestionArcNow() {
  const arc = document.getElementById('suggest-arc');
  if (!arc) return;

  restoreSuggestionArc();   // xoá dấu vết lần bay trước
  suggestArcDismissed = true;
  arc.hidden = true;
}

window.fillQuickPrompt = function(promptText) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = promptText;
    input.focus();
  }
};

// ĐỒNG BỘ KHỞI TẠO KHI TẢI TRANG HOÀN TẤT
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  initCollapsibleSidebarLogic();
  initHistorySearch();
  initSidebarThemeToggle();
  initSuggestionScrub();
  injectJiggleStyles();

  createNewChatSession();
});

// ==========================================
// INJECT NEW DYNAMIC MASCOT ANIMATIONS (FLOATING & VIOLENT BOUNCE)
// ==========================================
(function injectHeaderMascotAnimations() {
  if (document.getElementById('header-mascot-animations')) return;
  const style = document.createElement('style');
  style.id = 'header-mascot-animations';
  style.innerHTML = `
    @keyframes orbFloatGlow {
      0%, 100% {
        transform: translateY(0) scale(1);
        filter: drop-shadow(0 4px 8px rgba(184,138,58,0.28));
      }
      50% {
        transform: translateY(-5px) scale(1.05);
        filter: drop-shadow(0 12px 20px rgba(184,138,58,0.6));
      }
    }
    .animate-glowing-orb {
      animation: orbFloatGlow 3s ease-in-out infinite !important;
      will-change: transform, filter;
    }
    @keyframes violentBounce {
      0%, 100% { transform: translateY(0) scale(1); }
      10% { transform: translateY(-30px) scaleY(1.3) scaleX(0.85); }
      20% { transform: translateY(22px) scaleY(0.7) scaleX(1.25); }
      30% { transform: translateY(-22px) scaleY(1.15) scaleX(0.9); }
      40% { transform: translateY(16px) scaleY(0.85) scaleX(1.1); }
      50% { transform: translateY(-12px) scaleY(1.05); }
      60% { transform: translateY(10px) scaleY(0.95); }
      70% { transform: translateY(-6px); }
      80% { transform: translateY(4px); }
      90% { transform: translateY(-1px); }
    }
    .animate-violent-bounce {
      animation: violentBounce 1s cubic-bezier(.36,.07,.19,.97) both !important;
      will-change: transform;
    }
  `;
  document.head.appendChild(style);
})();
// ==========================================
// FORCE INJECT HACKATHON LIVE DOTS ANIMATION
// ==========================================
(function injectUltraLivelyDots() {
  if (document.getElementById('ultra-lively-dots-style')) return;
  const style = document.createElement('style');
  style.id = 'ultra-lively-dots-style';
  style.innerHTML = `
    .typing-dot {
      display: inline-block !important;
      will-change: transform, opacity, background-color, box-shadow;
      animation: ultra-lively-wave 0.5s infinite cubic-bezier(0.25, 1, 0.5, 1) !important;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.08s !important; }
    .typing-dot:nth-child(3) { animation-delay: 0.16s !important; }

    @keyframes ultra-lively-wave {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.4;
      }
      35% {
        transform: translateY(-10px) scaleX(0.8) scaleY(1.25) !important;
        opacity: 1;
        background-color: #c9a227 !important;
        box-shadow: 0 0 10px #c9a227, 0 0 20px rgba(201, 162, 39, 0.4);
      }
      70% {
        transform: translateY(1.5px) scaleX(1.2) scaleY(0.85) !important;
        opacity: 0.7;
      }
    }
  `;
  document.head.appendChild(style);
})();
