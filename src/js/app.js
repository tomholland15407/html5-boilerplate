/* eslint-disable */
/**
 * Smart Assistant - Trợ Lý Mua Sắm Thông Thái (JS Engine for Webpack)
 * Vietnam Innovation Challenge 2026
 * Hệ thống giao diện nâng cấp hướng cá nhân hóa người tiêu dùng đại chúng
 */

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
      raw_specs: {
        wattage: '800W',
        gas: 'R32',
        filter: 'Nanoe-G kháng khuẩn',
      },
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
      raw_specs: {
        wattage: '1100W',
        gas: 'R32',
        filter: 'Phin lọc Enzyme Blue',
      },
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
      raw_specs: {
        wattage: '850W',
        gas: 'R32',
        filter: 'Lọc bụi thô cơ bản',
      },
    },
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
      raw_specs: {
        shelves: 'Kính cường lực',
        design: 'Ngăn đá trên truyền thống',
      },
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
      raw_specs: {
        shelves: 'Kính cường lực chịu tải cao',
        design: 'Có khay lấy nước ngoài tiện lợi',
      },
    },
    {
      id: 'fridge-aqua-03',
      name: 'Tủ lạnh Aqua 90 lít AQR-D99FA',
      price: 2790000,
      brand: 'Aqua',
      liters: 90,
      family_size: '1 - 2 người (Sinh viên/Phòng đơn)',
      inverter: false,
      cooling: 'Làm lạnh trực tiếp bằng mạch khí',
      saving: 'Không có Inverter, điện năng tiêu tốn nhiều nếu mở liên tục',
      stock: 0,
      raw_specs: {
        shelves: 'Nhựa cứng',
        design: 'Mini gọn nhẹ',
      },
    },
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
      raw_specs: {
        cpu: 'Intel Core i5 Gen 12',
        ram: '8GB DDR4',
        storage: '512GB NVMe SSD',
      },
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
      raw_specs: {
        cpu: 'Intel Core i5 Gen 13 Hiệu năng cao',
        ram: '8GB DDR4',
        storage: '512GB PCIe SSD',
      },
    },
    {
      id: 'laptop-lenovo-03',
      name: 'Lenovo IdeaPad Slim 3 14IAH8 (Core i5 12450H / 16GB RAM / 512GB SSD)',
      price: 12900000,
      brand: 'Lenovo',
      weight: '1.43kg',
      screen: '14 inch viền hơi dày',
      usage: 'Đa nhiệm cực khủng với 16GB RAM không lo giật lag, gõ văn bản êm tay',
      battery: '3 - 4 tiếng dùng liên tục',
      stock: 22,
      raw_specs: {
        cpu: 'Intel Core i5 Gen 12',
        ram: '16GB LPDDR5',
        storage: '512GB SSD',
      },
    },
  ],
};

const MOCK_PROMOTIONS = {
  installment_0: ['ac-pana-01', 'ac-daikin-02', 'laptop-hp-01', 'fridge-lg-02'],
  discounts: {
    'ac-pana-01': 'Tặng ống đồng tối đa 5m trị giá 800.000đ',
    'laptop-asus-02': 'Tặng chuột không dây Silent trị giá 250.000đ',
    'fridge-lg-02': 'Phiếu mua hàng gia dụng 300.000đ',
  },
};

const MOCK_FAQ = {
  'bảo hành máy lạnh': 'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
  'bảo hành điều hòa': 'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
  'giao hàng': 'Dạ, miễn phí vận chuyển nội thành Đà Nẵng và các tỉnh có chi nhánh Điện Máy Xanh trong vòng 10km ạ. Giao lắp ngay trong ngày.',
  'trả góp': 'Dạ, hiện hệ thống hỗ trợ trả góp 0% lãi suất thông qua thẻ tín dụng hoặc các công ty tài chính (Home Credit, HD Saison) với thủ tục chỉ cần CCCD gắn chip ạ.',
};

// ==========================================
// 2. CONVERSATIONAL STATE & CONFIG
// ==========================================
let sessionState = {
  stage: 'INIT',
  category: null,
  collectedData: {
    budget: null,
    roomSize: null,
    sunExposure: null,
    familySize: null,
    usage: null,
  },
  probingQuestionCount: 0,
  history: [],
};

// HỆ THỐNG QUẢN LÝ LỊCH SỬ CHAT (CUSTOMER CHAT MEMORY CORE)
let consumerChatSessions = [];
let activeSessionId = null;

const SLANG_MAP = {
  đh: 'điều hòa / máy lạnh',
  ml: 'điều hòa / máy lạnh',
  tl: 'tủ lạnh',
  đt: 'điện thoại',
  dt: 'điện thoại',
  ko: 'không',
  đc: 'được',
  bth: 'bình thường',
  củ: 'triệu VNĐ',
  tr: 'triệu VNĐ',
  k: 'nghìn VNĐ',
  ngựa: 'HP (Sức ngựa)',
  m2: 'mét vuông',
};

// ==========================================
// 3. LINGUISTIC & LOCALIZED PARSERS
// ==========================================

function analyzeLinguisticSlang(text) {
  const slangDiv = document.getElementById('slang-inspector');
  if (!slangDiv) return; // Bảo vệ an toàn DOM ẩn

  slangDiv.innerHTML = '';
  const lowerText = text.toLowerCase();
  let detected = false;

  for (const [key, val] of Object.entries(SLANG_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerText)) {
      const pill = document.createElement('div');
      pill.className = 'flex items-center justify-between bg-white dark:bg-brand-panel px-2.5 py-1.5 rounded text-[11px] border border-slate-200 dark:border-brand-border transition-colors duration-300 shadow-sm';
      pill.innerHTML = `
        <span class="text-brand-gold font-bold">"${key}"</span>
        <i class="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
        <span class="text-brand-electric font-bold">${val}</span>
      `;
      slangDiv.appendChild(pill);
      detected = true;
    }
  }

  if (lowerText.includes('ngựa') || lowerText.includes('hp')) {
    const pill = document.createElement('div');
    pill.className = 'flex items-center justify-between bg-white dark:bg-brand-panel px-2.5 py-1.5 rounded text-[11px] border border-slate-200 dark:border-brand-border transition-colors duration-300 shadow-sm';
    pill.innerHTML = `
      <span class="text-brand-gold font-bold">"Ngựa / HP"</span>
      <i class="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
      <span class="text-brand-success font-bold">1 HP ≈ 9000 BTU</span>
    `;
    slangDiv.appendChild(pill);
    detected = true;
  }

  if (!detected) {
    slangDiv.innerHTML = `<span class="text-slate-400 dark:text-slate-500 italic text-[11px]">Chưa phát hiện từ viết tắt...</span>`;
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ');
}

// ==========================================
// 4. CHAT SYSTEM WORKFLOW & ACTION HANDLERS
// ==========================================

function scrollChatToBottom() {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;

  const indicatorHtml = `
    <div id="typing-indicator" class="flex items-start space-x-3 message-fade-in">
      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center overflow-hidden shrink-0 shadow-md">
        <img src="img/mascot.png" alt="Mascot Typing..." class="w-full h-full object-contain p-0.5 animate-pulse" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="bg-white dark:bg-brand-panel text-slate-400 dark:text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border transition-colors duration-300">
        <div class="flex items-center space-x-1 py-1">
          <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full typing-dot"></span>
          <span class="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full typing-dot"></span>
        </div>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', indicatorHtml);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

function appendUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;

  const messageHtml = `
    <div class="flex items-start space-x-3 justify-end message-fade-in">
      <div class="space-y-1 max-w-[80%]">
        <div class="bg-brand-cobalt text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md border border-brand-cobalt/20">
          <p class="text-sm leading-relaxed">${text}</p>
        </div>
        <div class="text-[10px] text-slate-400 dark:text-slate-500 text-right pr-2">Đã gửi</div>
      </div>
      <div class="w-9 h-9 rounded-xl bg-white dark:bg-brand-panel border border-slate-200 dark:border-brand-border flex items-center justify-center shrink-0 transition-colors duration-300 shadow-sm">
        <i class="fa-solid fa-user text-brand-electric text-sm"></i>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', messageHtml);
  scrollChatToBottom();

  // Ghi nhận tin nhắn vào cấu trúc Session hoạt động hiện tại để phục vụ phục hồi nếu cần
  if (activeSessionId) {
    const currentSess = consumerChatSessions.find(s => s.id === activeSessionId);
    if (currentSess) {
      currentSess.messages.push({ role: 'user', content: text });
    }
  }
}

function appendAssistantMessage(htmlContent) {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;

  const messageHtml = `
    <div class="flex items-start space-x-3 message-fade-in">
      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center overflow-hidden shrink-0 shadow-md">
        <img src="img/mascot.png" alt="Mascot Avatar" class="w-full h-full object-contain p-0.5" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="space-y-1 max-w-[85%] w-full">
        <div class="bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border transition-colors duration-300">
          ${htmlContent}
        </div>
        <span class="text-[10px] text-slate-400 dark:text-slate-500 pl-2">Phản hồi từ Trợ lý Thông thái</span>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', messageHtml);
  scrollChatToBottom();

  if (activeSessionId) {
    const currentSess = consumerChatSessions.find(s => s.id === activeSessionId);
    if (currentSess) {
      currentSess.messages.push({ role: 'assistant', content: htmlContent });
    }
  }
}

window.appendAssistantMessage = appendAssistantMessage;

// ==========================================
// 5. CHAT HISTORY MANAGEMENT FUNCTIONS
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

function updateActiveSessionTitle(newTitle) {
  if (!activeSessionId) return;
  const session = consumerChatSessions.find(s => s.id === activeSessionId);
  if (session) {
    session.title = newTitle;
    renderChatHistoryUI();
  }
}

function renderChatHistoryUI() {
  const container = document.getElementById('chat-history-list');
  if (!container) return;

  if (consumerChatSessions.length === 0) {
    container.innerHTML = `
      <div id="history-empty-state" class="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-brand-border/40 rounded-xl">
        <i class="fa-regular fa-comments text-slate-300 dark:text-slate-600 text-2xl mb-2 block"></i>
        <p class="text-[11px] text-slate-400 dark:text-slate-500 italic">Chưa có cuộc trò chuyện cũ nào tại phiên này.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  consumerChatSessions.forEach(session => {
    const isActive = session.id === activeSessionId;
    const pill = document.createElement('div');

    pill.className = `group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer text-xs font-medium relative history-item-appear ${
      isActive
      ? 'border-brand-electric/40 bg-brand-electric/5 text-brand-electric dark:bg-brand-electric/10'
      : 'border-slate-100 dark:border-brand-border/40 bg-slate-50/60 dark:bg-brand-panel/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-brand-border hover:bg-slate-100 dark:hover:bg-brand-dark/30'
    }`;

    // Tạo cấu trúc hiển thị text thân thiện kèm icon ngành hàng tương ứng
    let categoryIcon = '<i class="fa-regular fa-comment text-slate-400 group-hover:text-brand-electric transition-colors"></i>';
    if (session.category === 'ac') categoryIcon = '<i class="fa-solid fa-snowflake text-cyan-500"></i>';
    if (session.category === 'fridge') categoryIcon = '<i class="fa-solid fa-carrot text-emerald-500"></i>';
    if (session.category === 'laptop') categoryIcon = '<i class="fa-solid fa-laptop text-indigo-500"></i>';

    pill.innerHTML = `
      <div class="flex items-center space-x-2.5 truncate w-[85%]">
        <span class="shrink-0 text-sm">${categoryIcon}</span>
        <div class="truncate flex flex-col text-left">
          <span class="truncate font-semibold tracking-wide text-slate-900 dark:text-slate-100">${session.title}</span>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">${session.timestamp} • Điện Máy Xanh</span>
        </div>
      </div>
      <button class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-coral p-1 rounded transition-opacity" title="Xóa lịch sử này">
        <i class="fa-solid fa-trash-can text-[11px]"></i>
      </button>
    `;

    // Gắn trình xử lý sự kiện bấm khôi phục hoặc xóa session
    pill.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        e.stopPropagation();
        deleteChatSession(session.id);
      } else {
        switchChatSession(session.id);
      }
    });

    container.appendChild(pill);
  });
}

function deleteChatSession(id) {
  consumerChatSessions = consumerChatSessions.filter(s => s.id !== id);
  if (activeSessionId === id) {
    if (consumerChatSessions.length > 0) {
      activeSessionId = consumerChatSessions[0].id;
    } else {
      activeSessionId = null;
      window.resetConversation();
      return;
    }
  }
  renderChatHistoryUI();
}

function switchChatSession(id) {
  activeSessionId = id;
  renderChatHistoryUI();

  const targetSess = consumerChatSessions.find(s => s.id === id);
  if (!targetSess || targetSess.messages.length === 0) {
    // Nếu là phiên rỗng thì dọn dẹp màn hình chat về ban đầu
    clearChatBoxArea();
    return;
  }

  // Khôi phục lại toàn bộ giao diện hộp thoại tương ứng với dữ liệu đã lưu
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  chatBox.innerHTML = '';

  targetSess.messages.forEach(msg => {
    if (msg.role === 'user') {
      const uHtml = `
        <div class="flex items-start space-x-3 justify-end message-fade-in">
          <div class="space-y-1 max-w-[80%]">
            <div class="bg-brand-cobalt text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md border border-brand-cobalt/20">
              <p class="text-sm leading-relaxed">${msg.content}</p>
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 text-right pr-2">Lịch sử cuộc gọi</div>
          </div>
          <div class="w-9 h-9 rounded-xl bg-white dark:bg-brand-panel border border-slate-200 dark:border-brand-border flex items-center justify-center shrink-0 transition-colors duration-300 shadow-sm">
            <i class="fa-solid fa-user text-brand-electric text-sm"></i>
          </div>
        </div>
      `;
      chatBox.insertAdjacentHTML('beforeend', uHtml);
    } else {
      const aHtml = `
        <div class="flex items-start space-x-3 message-fade-in">
          <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            <img src="img/mascot.png" alt="Mascot Avatar" class="w-full h-full object-contain p-0.5" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
          </div>
          <div class="space-y-1 max-w-[85%] w-full">
            <div class="bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border transition-colors duration-300">
              ${msg.content}
            </div>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 pl-2">Đã khôi phục từ bộ nhớ</span>
          </div>
        </div>
      `;
      chatBox.insertAdjacentHTML('beforeend', aHtml);
    }
  });
  scrollChatToBottom();
}

function clearChatBoxArea() {
  const chatBox = document.getElementById('chat-box');
  if (!chatBox) return;
  chatBox.innerHTML = `
    <div class="flex items-start space-x-3 message-fade-in">
      <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center shrink-0 shadow-md overflow-hidden">
        <img src="img/mascot.png" alt="Mascot Avatar" class="w-full h-full object-contain p-0.5" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
      </div>
      <div class="space-y-1 max-w-[80%]">
        <div class="bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border transition-colors duration-300">
          <p class="text-sm leading-relaxed">
            Dạ, cuộc trò chuyện mới đã được mở sẵn sàng. Anh/chị hãy nhập thông tin thiết bị cần tìm kiếm nhé! ⚙️
          </p>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 6. CHAT SUBMISSION PROCESS (MAIN PIPELINE)
// ==========================================

function handleUserSubmit(event) {
  event.preventDefault();
  const inputEl = document.getElementById('user-input');
  if (!inputEl) return;

  const rawInput = inputEl.value.trim();
  if (!rawInput) return;

  // Nếu chưa có session nào được kích hoạt, tự động mở một session mới lập tức
  if (!activeSessionId) {
    createNewChatSession();
  }

  appendUserMessage(rawInput);
  inputEl.value = '';
  analyzeLinguisticSlang(rawInput);
  showTypingIndicator();

  const isCompareRequest = detectCompareKeyword(rawInput) || sessionState.stage === 'PROBING';
  const latency = isCompareRequest ? 1500 : 600;

  setTimeout(() => {
    removeTypingIndicator();
    processResponseLogic(rawInput, latency);
  }, latency);
}

function detectCompareKeyword(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes('tìm') ||
    lower.includes('mua') ||
    lower.includes('tư vấn') ||
    lower.includes('so sánh') ||
    lower.includes('gợi ý')
  );
}

function processResponseLogic(userInput, latency) {
  // Cập nhật giá trị an toàn thông qua hàm bọc cách ly lỗi
  const safeUpdateText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  safeUpdateText('latency-val', `${latency}ms`);
  const lowerInput = userInput.toLowerCase();

  if (detectUnknowSpecsOrPrices(lowerInput)) {
    triggerMissingDataResponse();
    return;
  }

  for (const [key, faqAns] of Object.entries(MOCK_FAQ)) {
    if (lowerInput.includes(key)) {
      updateSidebarLogs('faq', true);
      appendAssistantMessage(`<p class="text-sm leading-relaxed">${faqAns}</p>`);
      return;
    }
  }

  if (sessionState.stage === 'INIT') {
    if (
      lowerInput.includes('máy lạnh') ||
      lowerInput.includes('điều hòa') ||
      lowerInput.includes('đh') ||
      lowerInput.includes('hp') ||
      lowerInput.includes('ngựa')
    ) {
      sessionState.category = 'ac';
      sessionState.stage = 'PROBING';
      safeUpdateText('active-category', 'Máy Lạnh (AC)');

      // Đồng bộ nhãn tiêu đề lịch sử thân thiện cho khách hàng nhìn thấy
      updateActiveSessionTitle('❄️ Tư vấn mua Máy Lạnh');
      const curSess = consumerChatSessions.find(s => s.id === activeSessionId);
      if (curSess) curSess.category = 'ac';

    } else if (
      lowerInput.includes('tủ lạnh') ||
      lowerInput.includes('tl') ||
      lowerInput.includes('lít') ||
      lowerInput.includes('lit')
    ) {
      sessionState.category = 'fridge';
      sessionState.stage = 'PROBING';
      safeUpdateText('active-category', 'Tủ Lạnh');

      updateActiveSessionTitle('🥦 Tư vấn mua Tủ Lạnh');
      const curSess = consumerChatSessions.find(s => s.id === activeSessionId);
      if (curSess) curSess.category = 'fridge';

    } else if (
      lowerInput.includes('laptop') ||
      lowerInput.includes('máy tính') ||
      lowerInput.includes('ram') ||
      lowerInput.includes('i5')
    ) {
      sessionState.category = 'laptop';
      sessionState.stage = 'PROBING';
      safeUpdateText('active-category', 'Laptop');

      updateActiveSessionTitle('💻 Tư vấn mua Laptop');
      const curSess = consumerChatSessions.find(s => s.id === activeSessionId);
      if (curSess) curSess.category = 'laptop';

    } else {
      appendAssistantMessage(`
        <p class="text-sm">Dạ, Trợ lý Thông thái hiện đang kết nối trực tiếp với kho hàng để tư vấn về 3 ngành hàng chính: <strong>Máy lạnh, Tủ lạnh và Laptop</strong> ạ. 💻❄️</p>
        <p class="text-sm mt-2">Anh/chị có thể cho em hỏi mình đang muốn mua thiết bị lắp đặt cho gia đình hay sắm máy tính học tập để em tư vấn phân tích chuẩn nhất nhé ạ?</p>
      `);
      return;
    }
  }

  if (sessionState.stage === 'PROBING') {
    const stageEl = document.getElementById('chat-stage');
    if (stageEl) {
      stageEl.textContent = 'Đang Hỏi Ngược';
      stageEl.className = 'font-bold text-brand-gold';
    }

    extractDataIntoContext(lowerInput);

    if (sessionState.category === 'ac') {
      if (sessionState.collectedData.roomSize === null) {
        updateSidebarLogs('catalog', false);
        appendAssistantMessage(`
          <p class="text-sm">Dạ, máy lạnh tại hệ thống đang áp dụng cực nhiều ưu đãi giảm sâu và hỗ trợ trả góp 0% lãi suất ạ! ❄️</p>
          <p class="text-sm mt-2">Để em chọn lựa máy có công suất <strong>ngựa (HP)</strong> phù hợp, tránh hao tổn điện năng vô ích, anh/chị cho em hỏi <strong>diện tích phòng ngủ hoặc phòng khách</strong> của mình rộng khoảng bao nhiêu m² vậy ạ? Phòng của mình có bị hướng nắng nóng trực tiếp chiếu vào không anh/chị?</p>
        `);
        sessionState.collectedData.roomSize = 'WAITING';
        return;
      } else if (sessionState.collectedData.roomSize === 'WAITING') {
        parseRoomSizeAndSun(lowerInput);
        sessionState.stage = 'RECOMMENDATION';
      }
    } else if (sessionState.category === 'fridge') {
      if (sessionState.collectedData.familySize === null) {
        updateSidebarLogs('catalog', false);
        appendAssistantMessage(`
          <p class="text-sm">Dạ, việc chọn dung tích tủ lạnh phù hợp với số người sẽ giúp giữ thực phẩm luôn tươi ngon và tiết kiệm hóa đơn tiền điện đáng kể ạ. 🥦</p>
          <p class="text-sm mt-2">Anh/chị cho em hỏi **nhà mình hiện có khoảng bao nhiêu thành viên** sinh hoạt chung ạ? Và ngân sách dự phòng mình muốn đầu tư khoảng dưới bao nhiêu triệu thế ạ?</p>
        `);
        sessionState.collectedData.familySize = 'WAITING';
        return;
      } else if (sessionState.collectedData.familySize === 'WAITING') {
        parseFamilySizeAndBudget(lowerInput);
        sessionState.stage = 'RECOMMENDATION';
      }
    } else if (sessionState.category === 'laptop') {
      if (sessionState.collectedData.usage === null) {
        updateSidebarLogs('catalog', false);
        appendAssistantMessage(`
          <p class="text-sm">Dạ, các phân khúc laptop mỏng nhẹ dành cho học sinh, sinh viên và nhân viên văn phòng đang có giá cực tốt ạ. 💻</p>
          <p class="text-sm mt-2">Để cấu hình chạy mượt mà nhất, ngoài học tập và làm văn phòng cơ bản, mình có dùng thêm phần mềm thiết kế đồ họa (như Photoshop, Canva) hay chơi các tựa game nào khác không ạ?</p>
        `);
        sessionState.collectedData.usage = 'WAITING';
        return;
      } else if (sessionState.collectedData.usage === 'WAITING') {
        parseLaptopUsage(lowerInput);
        sessionState.stage = 'RECOMMENDATION';
      }
    }
  }

  if (sessionState.stage === 'RECOMMENDATION') {
    const stageEl = document.getElementById('chat-stage');
    if (stageEl) {
      stageEl.textContent = 'So Sánh & Đề Xuất';
      stageEl.className = 'font-bold text-brand-success';
    }

    updateSidebarLogs('catalog', true);
    updateSidebarLogs('promo', true);

    const recommendedHtml = generateTop3Recommendations(sessionState.category);
    appendAssistantMessage(recommendedHtml);

    // Nâng cấp nhãn lịch sử chat sau khi đã xuất ra kết quả đề xuất Top 3 thành công
    if (sessionState.category === 'ac') updateActiveSessionTitle('❄️ Top 3 Máy Lạnh tối ưu');
    if (sessionState.category === 'fridge') updateActiveSessionTitle('🥦 Top 3 Tủ Lạnh tối ưu');
    if (sessionState.category === 'laptop') updateActiveSessionTitle('💻 Top 3 Laptop phù hợp');

    sessionState.stage = 'INIT';
    sessionState.category = null;
    resetCollectedData();
  }
}

function detectUnknowSpecsOrPrices(input) {
  const productExclusions = [
    'iphone',
    'samsung s24',
    'macbook pro',
    'máy giặt',
    'máy sấy',
    'tivi',
    'sony',
    'toshiba',
  ];
  for (const item of productExclusions) {
    if (input.includes(item)) return true;
  }
  return false;
}

function triggerMissingDataResponse() {
  updateSidebarLogs('catalog', false);
  appendAssistantMessage(`
    <div class="space-y-2">
      <div class="flex items-center space-x-2 text-brand-coral font-bold text-sm">
        <i class="fa-solid fa-circle-exclamation animate-bounce"></i>
        <span>Sản phẩm này hiện đang cập nhật cơ sở dữ liệu...</span>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Kho hàng thử nghiệm hiện chưa lưu trữ thông số kỹ thuật hoặc bảng giá của hãng sản xuất cụ thể này.
      </p>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Để nhận thông tin chính xác 100%, em xin phép <strong>chuyển hướng kết nối trực tiếp anh/chị với chuyên viên siêu thị</strong> gần nhất để gọi điện hỗ trợ chỉ sau 2 phút được không ạ?
      </p>
      <div class="flex space-x-2 pt-2">
        <button type="button" onclick="window.appendAssistantMessage('<p class=\\'text-sm\\'>Dạ đã gửi thông tin thành công! Tổng đài viên Điện Máy Xanh sẽ gọi lại hỗ trợ ngay lập tức ạ.</p>')" class="bg-brand-cobalt hover:bg-brand-electric text-white text-xs px-3.5 py-2 rounded font-semibold transition-all">
          Gặp nhân viên tư vấn ngay
        </button>
      </div>
    </div>
  `);
}

function extractDataIntoContext(text) {
  if (text.includes('triệu') || text.includes('tr') || text.includes('củ')) {
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      sessionState.collectedData.budget = parseInt(numbers[0]) * 1000000;
    }
  }
}

function parseRoomSizeAndSun(text) {
  const match = text.match(/\d+/g);
  if (match && match.length > 0) {
    sessionState.collectedData.roomSize = parseInt(match[0]);
  } else {
    sessionState.collectedData.roomSize = 12;
  }
  sessionState.collectedData.sunExposure =
    text.includes('nắng') ||
    text.includes('nóng') ||
    text.includes('hướng tây');
}

function parseFamilySizeAndBudget(text) {
  const match = text.match(/\d+/g);
  if (match && match.length > 0) {
    sessionState.collectedData.familySize = parseInt(match[0]);
  } else {
    sessionState.collectedData.familySize = 4;
  }
}

function parseLaptopUsage(text) {
  sessionState.collectedData.usage = text;
}

function resetCollectedData() {
  sessionState.collectedData = {
    budget: null,
    roomSize: null,
    sunExposure: null,
    familySize: null,
    usage: null,
  };
}

window.resetConversation = function () {
  const chatBox = document.getElementById('chat-box');
  if (chatBox) {
    chatBox.innerHTML = `
      <div class="flex items-start space-x-3 message-fade-in">
        <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 dark:border-brand-border flex items-center justify-center shrink-0 shadow-md overflow-hidden">
          <img src="img/mascot.png" alt="Mascot Avatar" class="w-full h-full object-contain p-0.5" onerror="this.src='https://placehold.co/100x100?text=Mascot'">
        </div>
        <div class="space-y-1 max-w-[80%]">
          <div class="bg-white dark:bg-brand-panel text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-200 dark:border-brand-border transition-colors duration-300">
            <p class="text-sm leading-relaxed">
              Dạ, phiên hội thoại tư vấn đã được làm mới thành công từ đầu ạ! ⚙️
            </p>
            <p class="text-sm leading-relaxed mt-2">
              Anh/chị muốn tư vấn chọn lựa Máy lạnh, Tủ lạnh hay Laptop thương hiệu nào ạ? Hãy nhắn cho em nhé.
            </p>
          </div>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 pl-2">Vừa mới gửi</span>
        </div>
      </div>
    `;
  }

  sessionState.stage = 'INIT';
  sessionState.category = null;
  resetCollectedData();

  // Xóa trắng an toàn nội dung trong hộp debug ẩn để tránh lỗi xung đột dữ liệu
  const safeUpdateText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  const safeUpdateHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  safeUpdateText('active-category', 'Chưa xác định');
  safeUpdateText('chat-stage', 'Khởi tạo');
  safeUpdateHtml('slang-inspector', '<span class="text-slate-400 dark:text-slate-500 italic text-[11px]">Chưa phát hiện từ viết tắt...</span>');
  safeUpdateText('latency-val', '0ms');

  // Đồng thời tạo ngay một session trống hoàn toàn mới trong bộ nhớ lịch sử
  createNewChatSession();
};

window.fillQuickPrompt = function (promptText) {
  const inputEl = document.getElementById('user-input');
  if (inputEl) {
    inputEl.value = promptText;
    inputEl.focus();
  }
};

function updateSidebarLogs(system, active) {
  const elMap = {
    catalog: 'rag-catalog-status',
    promo: 'rag-promo-status',
    faq: 'rag-faq-status',
  };

  const targetEl = document.getElementById(elMap[system]);
  if (!targetEl) return;

  if (active) {
    targetEl.className = 'text-brand-success font-bold flex items-center';
    targetEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-brand-success inline-block mr-2 pulse-green"></span>Truy xuất OK`;
  } else {
    targetEl.className = 'text-brand-gold font-bold flex items-center';
    targetEl.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1.5"></i>Đang gọi API`;
  }
}

// ==========================================
// 6. SPEC-TO-BENEFIT TRANSLATION & COMPARISON
// ==========================================

function translateSpecToBenefit(specName, specVal) {
  const dictionary = {
    inverter: {
      true: 'Công nghệ Inverter tiết kiệm điện năng tiêu thụ tối đa, giúp máy chạy siêu êm ái, tăng cường tuổi thọ linh kiện.',
      false: 'Không có Inverter: Tiêu tốn nhiều điện năng hơn nếu hoạt động liên tục.',
    },
    screen_oled: {
      true: 'Màn hình OLED cao cấp dải màu rực rỡ, bảo vệ thị lực khi học tập và làm việc ban đêm.',
    },
    ram_16gb: {
      true: 'RAM 16GB đa nhiệm mượt mà, mở hàng chục tab Chrome đồng thời không lo giật lag.',
    },
  };

  return dictionary[specName] ? dictionary[specName][specVal] : '';
}

function generateTop3Recommendations(category) {
  const products = MOCK_CATALOG[category];
  let htmlResult = `
    <div class="space-y-4">
      <p class="text-sm">
        Dạ, dựa vào nhu cầu thực tế của gia đình mình, em đã lọc và đưa ra bảng so sánh <strong>Top 3 sản phẩm tối ưu nhất</strong> kèm phân tích điểm đánh đổi chi tiết giúp anh/chị dễ đưa ra quyết định:
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
  `;

  products.forEach((product, idx) => {
    const isInstallmentZero = MOCK_PROMOTIONS.installment_0.includes(product.id);
    const gift = MOCK_PROMOTIONS.discounts[product.id] || 'Không áp dụng quà tặng đi kèm';
    const stockText =
      product.stock > 0
        ? `<span class="text-brand-success font-semibold">Còn hàng (${product.stock} máy tại siêu thị)</span>`
        : `<span class="text-brand-coral font-semibold">Hết hàng tạm thời (No Stock)</span>`;

    let benefitHighlight = '';
    let tradeoffHighlight = '';

    if (category === 'ac') {
      benefitHighlight = `
        <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-brand-dark/50 p-2.5 rounded-lg border border-slate-200 dark:border-brand-border">
          <p class="text-[11px] text-brand-success font-bold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Phù hợp hoàn hảo cho không gian <strong>${product.room_size}</strong>.</p>
          <p>• ${translateSpecToBenefit('inverter', product.inverter)}</p>
          <p>• Độ ồn tối đa chỉ <strong>${product.noise}</strong>.</p>
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Mức giá rẻ nhất phân khúc giúp tiết kiệm tài chính ban đầu cực tốt, tuy nhiên máy chỉ trang bị màng lọc thô cơ bản (không kháng khuẩn bụi mịn PM2.5) và máy chạy phát tiếng ồn lớn hơn khi quá tải.'
          : idx === 1
            ? 'Khả năng làm lạnh nhanh vượt trội nhưng giá thành tương đối cao hơn các dòng khác, thiết kế cục nóng lớn cần vị trí lắp đặt thông thoáng rộng rãi.'
            : 'Công suất 1 HP chỉ khuyên dùng cho không gian dưới 15m², nếu phòng bị nắng rát chiếu trực tiếp hướng Tây vào buổi trưa thì máy sẽ mất nhiều thời gian để làm mát sâu.';
    } else if (category === 'fridge') {
      benefitHighlight = `
        <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-brand-dark/50 p-2.5 rounded-lg border border-slate-200 dark:border-brand-border">
          <p class="text-[11px] text-brand-success font-bold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Dung tích <strong>${product.liters} Lít</strong>, tối ưu cho <strong>${product.family_size}</strong>.</p>
          <p>• ${product.cooling}</p>
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Giá thành mini rẻ nhất cho các bạn sinh viên nhưng dung tích rất nhỏ 90L không có ngăn cấp đông mềm chuyên dụng, dễ đóng tuyết nếu dùng lâu và không tiết kiệm điện.'
          : idx === 0
            ? 'Thiết kế ngăn đá phía trên truyền thống quen thuộc nhưng mỗi lần lấy rau củ ngăn dưới cùng mình sẽ phải khom người hơi mỏi nhẹ một chút.'
            : 'Trang bị vòi lấy nước ngoài siêu tiện lợi, tuy nhiên kích thước tủ khá to ngang, đòi hỏi không gian nhà bếp rộng rãi để mở cánh tủ thoải mái.';
    } else if (category === 'laptop') {
      const is16GB = product.id === 'laptop-lenovo-03';
      benefitHighlight = `
        <div class="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-brand-dark/50 p-2.5 rounded-lg border border-slate-200 dark:border-brand-border">
          <p class="text-[11px] text-brand-success font-bold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Trọng lượng mỏng nhẹ <strong>${product.weight}</strong> dễ dàng mang đi học nhóm.</p>
          <p>• Màn hình sắc nét <strong>${product.screen}</strong> bảo vệ mắt tốt.</p>
          ${is16GB ? `<p>• ${translateSpecToBenefit('ram_16gb', true)}</p>` : `<p>• RAM 8GB đáp ứng trọn vẹn mọi nhu cầu văn phòng mượt mà.</p>`}
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Sở hữu cấu hình đa nhiệm 16GB RAM cực mạnh nhưng chất liệu vỏ nhựa tối giản, viền màn hình hơi dày so với các dòng cao cấp vỏ nhôm.'
          : idx === 0
            ? 'Thiết kế vỏ nhôm tinh xảo cao cấp mỏng nhẹ nhưng thời lượng pin ở mức trung bình (4-5 tiếng), bạn nên chú ý mang theo bộ sạc khi học cả ngày.'
            : 'Màn hình OLED rực rỡ nịnh mắt nhưng vỏ máy cấu trúc bóng dễ bám dấu vân tay khi thao tác mở gập liên tục.';
    }

    htmlResult += `
      <div class="trade-off-card bg-slate-50 dark:bg-brand-dark rounded-xl p-4 border border-slate-200 dark:border-brand-border flex flex-col justify-between space-y-3 transition-all duration-300 shadow-sm dark:shadow-none">
        <div>
          <div class="flex justify-between items-start mb-2">
            <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-electric/10 text-brand-electric border border-brand-electric/20 rounded">
              Gợi Ý ${idx + 1}
            </span>
            ${isInstallmentZero ? `<span class="px-2 py-0.5 text-[10px] font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded">Góp 0%</span>` : ''}
          </div>

          <h3 class="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 min-h-[32px] transition-colors duration-300">${product.name}</h3>

          <div class="mt-2 text-base font-extrabold text-brand-cobalt dark:text-white transition-colors duration-300">
            ${formatVND(product.price)}
          </div>

          <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Trạng thái: ${stockText}
          </div>

          <div class="mt-3">
            ${benefitHighlight}
          </div>

          <div class="mt-3 space-y-1 bg-brand-coral/5 p-2.5 rounded-lg border border-brand-coral/15 text-xs text-slate-700 dark:text-slate-300">
            <p class="text-[11px] text-brand-coral font-bold uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i> Điểm cần cân nhắc (Trade-off):
            </p>
            <p class="leading-relaxed text-[11px]">${tradeoffHighlight}</p>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-200 dark:border-brand-border space-y-2">
          <div class="text-[11px] text-slate-500 dark:text-slate-400">
            🎁 <strong>Quà tặng:</strong> <span class="text-slate-700 dark:text-slate-200 font-medium">${gift}</span>
          </div>
          <button type="button" onclick="window.appendAssistantMessage('<p class=\\'text-sm\\'>Dạ em đã thêm <strong>${product.name}</strong> vào danh sách mua sắm kèm bộ quà tặng khuyến mãi đặc quyền Điện Máy Xanh rồi nhé ạ!</p>')" class="w-full bg-white dark:bg-brand-panel hover:bg-brand-cobalt hover:text-white text-xs py-2 rounded-lg border border-slate-200 dark:border-brand-border hover:border-brand-cobalt font-semibold transition-all duration-200 shadow-sm">
            Chọn Mua / Nhận Tư Vấn Sâu
          </button>
        </div>
      </div>
    `;
  });

  htmlResult += `
      </div>
    </div>
  `;
  return htmlResult;
}

// =================================================================
// 7. BỘ ĐIỀU KHIỂN ĐÓNG/MỞ SIDEBAR COLLAPSIBLE CHUYÊN NGHIỆP
// =================================================================
function initCollapsibleSidebarLogic() {
  const sidebarPanel = document.getElementById('sidebar-panel');
  const btnClose = document.getElementById('sidebar-toggle-close');
  const btnOpen = document.getElementById('sidebar-toggle-open');

  if (!sidebarPanel || !btnClose || !btnOpen) return;

  // Lắng nghe sự kiện click nút thu gọn (Close)
  btnClose.addEventListener('click', () => {
    sidebarPanel.classList.add('sidebar-collapsed-state');
    btnOpen.classList.remove('hidden'); // Hiển thị nút mở rộng nổi
  });

  // Lắng nghe sự kiện click nút mở rộng (Open)
  btnOpen.addEventListener('click', () => {
    sidebarPanel.classList.remove('sidebar-collapsed-state');
    btnOpen.classList.add('hidden'); // Ẩn nút mở rộng đi
  });
}

// KHỞI CHẠY KHI TOÀN BỘ DOM ĐÃ SẴN SÀNG KHÔNG LỖI WEBPACK COMPILER
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  if (form) {
    form.addEventListener('submit', handleUserSubmit);
  }

  // Khởi tạo cơ chế thu gọn sidebar
  initCollapsibleSidebarLogic();

  // Tự động tạo phiên trò chuyện mặc định đầu tiên cho trải nghiệm mượt mà
  createNewChatSession();
});
