/* eslint-disable */
/**
 * Smart Assistant - Trợ Lý Mua Sắm Thông Thái (JS Engine)
 * Toàn bộ cơ sở dữ liệu MockData và logic điều phối hội thoại
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

// Cấu trúc trạng thái ứng dụng
let sessionState = {
  stage: 'INIT',
  category: null,
  collectedData: { roomSize: null, familySize: null },
};

let consumerChatSessions = [];
let activeSessionId = null;

// ==========================================
// HỆ THỐNG ĐIỀU KHIỂN ĐÓNG/MỞ SIDEBAR (ĐÃ ĐƯỢC FIX)
// ==========================================
function initCollapsibleSidebarLogic() {
  const sidebarPanel = document.getElementById('sidebar-panel');
  const btnClose = document.getElementById('btn-close-sidebar');
  const btnOpen = document.getElementById('btn-open-sidebar');

  if (!sidebarPanel || !btnClose || !btnOpen) return;

  // 1. Khi bấm nút Thu gọn (<<)
  btnClose.addEventListener('click', () => {
    // Xóa các class chiếm diện tích của Tailwind để ép thu về 0px triệt để
    sidebarPanel.classList.remove('w-80', 'p-5', 'border-r');
    sidebarPanel.classList.add('w-0', 'p-0', 'border-r-0', 'opacity-0', 'pointer-events-none');

    // Kích hoạt nút Lịch sử xuất hiện
    btnOpen.classList.remove('hidden');
  });

  // 2. Khi bấm nút Mở rộng (>> Lịch sử)
  btnOpen.addEventListener('click', () => {
    // Gỡ bỏ trạng thái ẩn hoàn toàn
    sidebarPanel.classList.remove('w-0', 'p-0', 'border-r-0', 'opacity-0', 'pointer-events-none');
    // Khôi phục đầy đủ layout ban đầu của sidebar
    sidebarPanel.classList.add('w-80', 'p-5', 'border-r');

    // Ẩn nút đi cho thoáng diện tích
    btnOpen.classList.add('hidden');
  });
}

// ==========================================
// CORE FUNCTIONS - XỬ LÝ LỘC LUỒNG CHAT
// ==========================================

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');
}

function scrollChatToBottom() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  const html = `
    <div id="typing-indicator" class="flex items-start space-x-3 message-fade-in">
      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center overflow-hidden shrink-0 shadow-md">
        <img src="img/mascot.png" alt="..." class="w-full h-full object-contain p-0.5 animate-pulse" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="bg-white dark:bg-brand-panel text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border">
        <div class="flex items-center space-x-1 py-1">
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
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
        <div class="bg-brand-cobalt text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
          <p class="text-sm leading-relaxed">${text}</p>
        </div>
      </div>
      <div class="w-9 h-9 rounded-xl bg-white dark:bg-brand-panel border border-slate-200 dark:border-brand-border flex items-center justify-center shrink-0 shadow-sm">
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

function appendAssistantMessage(htmlContent) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  const html = `
    <div class="flex items-start space-x-3 message-fade-in">
      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center overflow-hidden shrink-0 shadow-md">
        <img src="img/mascot.png" alt="Avatar" class="w-full h-full object-contain p-0.5" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="space-y-1 max-w-[85%] w-full">
        <div class="bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border">
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
  const newSession = {
    id: newId,
    title: initialTitle,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    messages: [],
    category: null
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

  if (consumerChatSessions.length === 0) {
    container.innerHTML = `
      <div id="history-empty-state" class="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-brand-border/40 rounded-xl">
        <p class="text-[11px] text-slate-400 italic">Chưa có cuộc trò chuyện cũ.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  consumerChatSessions.forEach(session => {
    const isActive = session.id === activeSessionId;
    const pill = document.createElement('div');

    pill.className = `group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer text-xs font-medium history-item-appear ${
      isActive
      ? 'border-brand-electric/40 bg-brand-electric/5 text-brand-electric dark:bg-brand-electric/10'
      : 'border-slate-100 dark:border-brand-border/40 bg-slate-50/60 dark:bg-brand-panel/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-brand-dark/30'
    }`;

    let icon = '<i class="fa-regular fa-comment text-slate-400"></i>';
    if (session.category === 'ac') icon = '<i class="fa-solid fa-snowflake text-cyan-500"></i>';
    if (session.category === 'fridge') icon = '<i class="fa-solid fa-carrot text-emerald-500"></i>';
    if (session.category === 'laptop') icon = '<i class="fa-solid fa-laptop text-indigo-500"></i>';

    pill.innerHTML = `
      <div class="flex items-center space-x-2.5 truncate w-[90%]">
        <span class="shrink-0 text-sm">${icon}</span>
        <div class="truncate flex flex-col text-left">
          <span class="truncate font-semibold text-slate-900 dark:text-slate-100">${session.title}</span>
          <span class="text-[10px] text-slate-400 mt-0.5">${session.timestamp} • Điện Máy Xanh</span>
        </div>
      </div>`;

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
  if (!chatBox || session.messages.length === 0) return;
  chatBox.innerHTML = '';
  session.messages.forEach(msg => {
    if (msg.role === 'user') {
      const html = `<div class="flex items-start space-x-3 justify-end message-fade-in"><div class="max-w-[80%] bg-brand-cobalt text-white rounded-2xl px-4 py-3 text-sm">${msg.content}</div></div>`;
      chatBox.insertAdjacentHTML('beforeend', html);
    } else {
      const html = `<div class="flex items-start space-x-3 message-fade-in"><div class="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0"><img src="img/mascot.png" class="p-0.5 object-contain"></div><div class="max-w-[85%] bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl px-4 py-3 border border-slate-200 dark:border-brand-border text-sm">${msg.content}</div></div>`;
      chatBox.insertAdjacentHTML('beforeend', html);
    }
  });
  scrollChatToBottom();
}

// ==========================================
// PIPELINE XỬ LÝ CHAT & LOGIC PHÂN TÍCH RAG
// ==========================================
function handleFormSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('user-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!activeSessionId) createNewChatSession();

  appendUserMessage(val);
  input.value = '';
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    dispatchLogicEngine(val);
  }, 700);
}

function dispatchLogicEngine(text) {
  const lower = text.toLowerCase();

  // Kiểm tra FAQ nhanh
  for (const [key, answer] of Object.entries(MOCK_FAQ)) {
    if (lower.includes(key)) {
      appendAssistantMessage(`<p class="text-sm">${answer}</p>`);
      return;
    }
  }

  // Khởi tạo phỏng vấn nhu cầu mua sắm khách hàng
  if (sessionState.stage === 'INIT') {
    if (lower.includes('máy lạnh') || lower.includes('điều hòa') || lower.includes('đh')) {
      sessionState.category = 'ac';
      sessionState.stage = 'PROBING';
      updateActiveSessionTitle('Tư vấn mua Máy Lạnh', 'ac');
    } else if (lower.includes('tủ lạnh') || lower.includes('tl')) {
      sessionState.category = 'fridge';
      sessionState.stage = 'PROBING';
      updateActiveSessionTitle('Tư vấn mua Tủ Lạnh', 'fridge');
    } else if (lower.includes('laptop') || lower.includes('máy tính')) {
      sessionState.category = 'laptop';
      sessionState.stage = 'PROBING';
      updateActiveSessionTitle('Tư vấn mua Laptop', 'laptop');
    } else {
      appendAssistantMessage('<p class="text-sm">Dạ, em có thể hỗ trợ tư vấn chuyên sâu về <strong>Máy lạnh, Tủ lạnh, Laptop</strong>. Anh/chị đang muốn sắm sản phẩm nào ạ?</p>');
      return;
    }
  }

  if (sessionState.stage === 'PROBING') {
    if (sessionState.category === 'ac') {
      if (!sessionState.collectedData.roomSize) {
        appendAssistantMessage('<p class="text-sm">Dạ, anh/chị cho em hỏi <strong>diện tích phòng lắp đặt</strong> rộng khoảng bao nhiêu m² để em tính toán số Ngựa (HP) phù hợp nhất ạ?</p>');
        sessionState.collectedData.roomSize = 'WAITING';
        return;
      } else {
        sessionState.stage = 'RECOMMENDATION';
      }
    } else if (sessionState.category === 'fridge') {
      if (!sessionState.collectedData.familySize) {
        appendAssistantMessage('<p class="text-sm">Dạ, nhà mình hiện tại <strong>có khoảng mấy thành viên</strong> sử dụng tủ lạnh chung ạ để em tính dung tích lít tối ưu?</p>');
        sessionState.collectedData.familySize = 'WAITING';
        return;
      } else {
        sessionState.stage = 'RECOMMENDATION';
      }
    } else {
      sessionState.stage = 'RECOMMENDATION';
    }
  }

  if (sessionState.stage === 'RECOMMENDATION') {
    const products = MOCK_CATALOG[sessionState.category];
    let cardsHtml = `<p class="text-sm mb-3">Dạ, em đã tra cứu kho hàng và đề xuất <strong>Top 3 sản phẩm</strong> phù hợp nhất kèm phân tích điểm đánh đổi (Trade-off):</p><div class="grid grid-cols-1 lg:grid-cols-3 gap-4">`;

    products.forEach((p, idx) => {
      const promo = MOCK_PROMOTIONS.discounts[p.id] || 'Tặng phiếu mua hàng bách hóa';
      cardsHtml += `
        <div class="bg-slate-50 dark:bg-brand-dark rounded-xl p-4 border border-slate-200 dark:border-brand-border flex flex-col justify-between space-y-3">
          <div>
            <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-electric/10 text-brand-electric rounded">Gợi ý ${idx+1}</span>
            <h3 class="font-bold text-xs text-slate-900 dark:text-white mt-1">${p.name}</h3>
            <div class="text-sm font-extrabold text-blue-600 dark:text-brand-electric mt-1">${formatVND(p.price)}</div>
            <p class="text-[11px] text-slate-500 mt-2">Quà khuyến mãi: ${promo}</p>
          </div>
          <div class="bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-[11px] text-amber-700 dark:text-amber-400 border border-amber-200/50">
            <strong>Cân nhắc:</strong> Dòng này bán chạy nên đôi khi xảy ra tình trạng thiếu hàng cục bộ, cần đặt trước.
          </div>
          <button onclick="window.appendAssistantMessage('<p class=\\'text-sm\\'>Dạ tuyệt vời, em đã ghi nhận yêu cầu đặt mua sản phẩm của anh/chị!</p>')" class="w-full bg-white dark:bg-brand-panel hover:bg-brand-electric hover:text-white text-xs py-2 rounded-lg border border-slate-200 dark:border-brand-border font-semibold transition-all">Chọn sản phẩm</button>
        </div>`;
    });

    cardsHtml += `</div>`;
    appendAssistantMessage(cardsHtml);

    // Reset state về ban đầu
    sessionState.stage = 'INIT';
    sessionState.category = null;
    sessionState.collectedData = { roomSize: null, familySize: null };
  }
}

window.resetConversation = function() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) {
    chatBox.innerHTML = `<div class="flex items-start space-x-3"><div class="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0"><img src="img/mascot.png" class="p-0.5 object-contain"></div><div class="max-w-[80%] bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl px-4 py-3 border border-slate-200 dark:border-brand-border text-sm">Dạ, phiên hội thoại tư vấn mua sắm mới đã sẵn sàng phục vụ rồi ạ!</div></div>`;
  }
  sessionState.stage = 'INIT';
  sessionState.category = null;
  sessionState.collectedData = { roomSize: null, familySize: null };
  createNewChatSession();
};

window.fillQuickPrompt = function(promptText) {
  const input = document.getElementById('user-input');
  if (input) {
    input.value = promptText;
    input.focus();
  }
};

// Khởi tạo các sự kiện khi tải trang hoàn tất
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Kích hoạt tính năng đóng mở mượt mà của Sidebar
  initCollapsibleSidebarLogic();

  // Tạo phiên trò chuyện mặc định
  createNewChatSession();
});
