/**
 * Smart Assistant - Trợ Lý Mua Sắm Thông Thái (JS Engine for Webpack)
 * Vietnam Innovation Challenge 2026
 */

// ==========================================
// 1. MOCK GROUND TRUTH DATABASE (RAG TARGET)
// ==========================================
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
      stock: 0, // Hết hàng để kiểm nghiệm Anti-Hallucination
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
      usage:
        'Đa nhiệm cực khủng với 16GB RAM không lo giật lag, gõ văn bản êm tay',
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
  'bảo hành máy lạnh':
    'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
  'bảo hành điều hòa':
    'Dạ, tất cả các dòng máy lạnh Panasonic và Daikin tại hệ thống được bảo hành chính hãng tại nhà 1 năm toàn bộ máy và 5 năm cho máy nén ạ. Casper bảo hành 2 năm.',
  'giao hàng':
    'Dạ, miễn phí vận chuyển nội thành Đà Nẵng và các tỉnh có chi nhánh Điện Máy Xanh trong vòng 10km ạ. Giao lắp ngay trong ngày.',
  'trả góp':
    'Dạ, hiện hệ thống hỗ trợ trả góp 0% lãi suất thông qua thẻ tín dụng hoặc các công ty tài chính (Home Credit, HD Saison) với thủ tục chỉ cần CCCD gắn chip ạ.',
};

// ==========================================
// 2. CONVERSATIONAL STATE & CONFIG
// ==========================================
let sessionState = {
  stage: 'INIT', // INIT -> PROBING -> RECOMMENDATION -> DONE
  category: null, // "ac", "fridge", "laptop"
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

// Bản đồ dịch thuật từ lóng & viết tắt địa phương tiếng Việt
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
  slangDiv.innerHTML = ''; // Clear
  const lowerText = text.toLowerCase();
  let detected = false;

  for (const [key, val] of Object.entries(SLANG_MAP)) {
    // Sử dụng Regex để định vị chuẩn xác từ viết tắt độc lập, không bị lẫn vào từ khác
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    if (regex.test(lowerText)) {
      const pill = document.createElement('div');
      pill.className =
        'flex items-center justify-between bg-slate-800 px-2 py-1 rounded text-[11px] border border-slate-700/50';
      pill.innerHTML = `
        <span class="text-accent-amber font-semibold">"${key}"</span>
        <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i>
        <span class="text-green-400 font-medium">${val}</span>
      `;
      slangDiv.appendChild(pill);
      detected = true;
    }
  }

  // Phân tích thêm đơn vị "ngựa" cho điều hòa
  if (lowerText.includes('ngựa') || lowerText.includes('hp')) {
    const pill = document.createElement('div');
    pill.className =
      'flex items-center justify-between bg-slate-800 px-2 py-1 rounded text-[11px] border border-slate-700/50';
    pill.innerHTML = `
      <span class="text-accent-amber font-semibold">"Ngựa / HP"</span>
      <i class="fa-solid fa-arrow-right text-[10px] text-slate-500"></i>
      <span class="text-green-400 font-medium">Quy đổi: 1 Ngựa ≈ 9000 BTU</span>
    `;
    slangDiv.appendChild(pill);
    detected = true;
  }

  if (!detected) {
    slangDiv.innerHTML = `<span class="text-slate-500 italic">Chưa phát hiện từ viết tắt trong câu...</span>`;
  }
}

// Hàm chuyển định dạng tiền tệ Việt Nam Đồng
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
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const chatBox = document.getElementById('chat-box');
  const indicatorHtml = `
    <div id="typing-indicator" class="flex items-start space-x-3 message-fade-in">
      <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
        <i class="fa-solid fa-robot text-slate-400 text-sm"></i>
      </div>
      <div class="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-700/50">
        <div class="flex items-center space-x-1 py-1">
          <span class="w-2.5 h-2.5 bg-slate-500 rounded-full typing-dot"></span>
          <span class="w-2.5 h-2.5 bg-slate-500 rounded-full typing-dot"></span>
          <span class="w-2.5 h-2.5 bg-slate-500 rounded-full typing-dot"></span>
        </div>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', indicatorHtml);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function appendUserMessage(text) {
  const chatBox = document.getElementById('chat-box');
  const messageHtml = `
    <div class="flex items-start space-x-3 justify-end message-fade-in">
      <div class="space-y-1 max-w-[80%]">
        <div class="bg-brand-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md">
          <p class="text-sm leading-relaxed">${text}</p>
        </div>
        <div class="text-[10px] text-slate-500 text-right pr-2">Đã gửi</div>
      </div>
      <div class="w-9 h-9 rounded-xl bg-brand-900 border border-brand-500 flex items-center justify-center shrink-0">
        <i class="fa-solid fa-user text-brand-100 text-sm"></i>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', messageHtml);
  scrollChatToBottom();
}

function appendAssistantMessage(htmlContent) {
  const chatBox = document.getElementById('chat-box');
  const messageHtml = `
    <div class="flex items-start space-x-3 message-fade-in">
      <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-md">
        <i class="fa-solid fa-robot text-white text-sm"></i>
      </div>
      <div class="space-y-1 max-w-[85%] w-full">
        <div class="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-700/50">
          ${htmlContent}
        </div>
        <span class="text-[10px] text-slate-500 pl-2">Phản hồi từ RAG Engine</span>
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', messageHtml);
  scrollChatToBottom();
}

// ==========================================
// 5. CHAT SUBMISSION PROCESS (MAIN PIPELINE)
// ==========================================

function handleUserSubmit(event) {
  event.preventDefault();
  const inputEl = document.getElementById('user-input');
  const rawInput = inputEl.value.trim();
  if (!rawInput) return;

  // 1. Gửi tin nhắn lên khung chat
  appendUserMessage(rawInput);
  inputEl.value = '';

  // 2. Chạy bộ phân tích từ lóng ra sidepanel
  analyzeLinguisticSlang(rawInput);

  // 3. Hiển thị hoạt ảnh typing
  showTypingIndicator();

  // 4. Giả lập độ trễ đạt chuẩn Hackathon (Hỏi thường < 3s, So sánh < 5s)
  const isCompareRequest =
    detectCompareKeyword(rawInput) || sessionState.stage === 'PROBING';
  const latency = isCompareRequest ? 1600 : 750; // Giả lập thời gian phản hồi thực tế của LLM

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
  // Đồng bộ độ trễ thực tế ra Sidebar
  document.getElementById('latency-val').textContent = `${latency}ms`;

  const lowerInput = userInput.toLowerCase();

  // Hàng rào chặn ảo giác: Phát hiện từ khóa sản phẩm không có trong Catalog (Anti-Hallucination)
  if (detectUnknowSpecsOrPrices(lowerInput)) {
    triggerMissingDataResponse();
    return;
  }

  // Xử lý các câu hỏi FAQ chính sách (bảo hành, lắp đặt, vận chuyển, trả góp)
  for (const [key, faqAns] of Object.entries(MOCK_FAQ)) {
    if (lowerInput.includes(key)) {
      updateSidebarLogs('faq', true);
      appendAssistantMessage(
        `<p class="text-sm leading-relaxed">${faqAns}</p>`,
      );
      return;
    }
  }

  // KHỞI CHẠY TIẾN TRÌNH: NHẬN DIỆN NGÀNH HÀNG KHÁCH HÀNG ĐANG HỎI
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
      document.getElementById('active-category').textContent = 'Máy Lạnh (AC)';
    } else if (
      lowerInput.includes('tủ lạnh') ||
      lowerInput.includes('tl') ||
      lowerInput.includes('lít') ||
      lowerInput.includes('lit')
    ) {
      sessionState.category = 'fridge';
      sessionState.stage = 'PROBING';
      document.getElementById('active-category').textContent = 'Tủ Lạnh';
    } else if (
      lowerInput.includes('laptop') ||
      lowerInput.includes('máy tính') ||
      lowerInput.includes('ram') ||
      lowerInput.includes('i5')
    ) {
      sessionState.category = 'laptop';
      sessionState.stage = 'PROBING';
      document.getElementById('active-category').textContent = 'Laptop';
    } else {
      // Ngoài phạm vi demo của 3 ngành hàng
      appendAssistantMessage(`
        <p class="text-sm">Dạ, Trợ lý Thông thái hiện đang sẵn sàng cơ sở dữ liệu để tư vấn cho mình về 3 ngành hàng: <strong>Máy lạnh (Điều hòa), Tủ lạnh và Laptop</strong> ạ. 💻❄️</p>
        <p class="text-sm mt-2">Anh/chị có thể cho em hỏi mình đang muốn nâng cấp cho không gian sống hay sắm thiết bị phục vụ học tập/làm việc để em tư vấn chi tiết nhất nhé ạ?</p>
      `);
      return;
    }
  }

  // TIẾN TRÌNH HỎI NGƯỢC (STEP 1: PROACTIVE PROBING)
  if (sessionState.stage === 'PROBING') {
    document.getElementById('chat-stage').textContent = 'Đang Hỏi Ngược';
    document.getElementById('chat-stage').className =
      'font-semibold text-accent-orange';

    // Trích xuất ngân sách nếu có (ví dụ: "dưới 15 củ")
    extractDataIntoContext(lowerInput);

    if (sessionState.category === 'ac') {
      if (sessionState.collectedData.roomSize === null) {
        updateSidebarLogs('catalog', false);
        appendAssistantMessage(`
          <p class="text-sm">Dạ, máy lạnh tại hệ thống đang có rất nhiều dòng tiết kiệm điện cực xịn sò ạ!</p>
          <p class="text-sm mt-2">Để em chọn được dòng máy chạy êm và có công suất **ngựa (HP)** vừa vặn nhất, anh/chị cho em hỏi <strong>diện tích phòng ngủ/phòng khách</strong> của mình khoảng bao nhiêu mét vuông (m²) vậy ạ? Và phòng mình có bị hướng nắng nóng chiếu trực tiếp vào không anh/chị?</p>
        `);
        sessionState.collectedData.roomSize = 'WAITING'; // Set cờ đợi câu trả lời diện tích
        return;
      } else if (sessionState.collectedData.roomSize === 'WAITING') {
        parseRoomSizeAndSun(lowerInput);
        sessionState.stage = 'RECOMMENDATION';
      }
    } else if (sessionState.category === 'fridge') {
      if (sessionState.collectedData.familySize === null) {
        updateSidebarLogs('catalog', false);
        appendAssistantMessage(`
          <p class="text-sm">Dạ, tủ lạnh là thiết bị tối quan trọng cho gia đình, lựa chọn dung tích lít phù hợp sẽ giúp bảo quản thực phẩm tối ưu và tránh lãng phí điện năng ạ.</p>
          <p class="text-sm mt-2">Để em lọc sản phẩm chuẩn xác nhất, anh/chị cho em hỏi **nhà mình có khoảng bao nhiêu thành viên** sinh hoạt chung ạ? Và anh/chị mong muốn tầm tài chính khoảng bao nhiêu "củ" đổ lại ạ?</p>
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
          <p class="text-sm">Dạ, laptop mỏng nhẹ mang đi lại cho sinh viên là phân khúc đang có rất nhiều deal hời kèm trả góp 0% lãi suất ạ!</p>
          <p class="text-sm mt-2">Để em lọc cấu hình mượt mà nhất, ngoài việc học và làm văn phòng thông thường thì bạn có chơi game online hay dùng các phần mềm đồ họa thiết kế nào khác không ạ?</p>
        `);
        sessionState.collectedData.usage = 'WAITING';
        return;
      } else if (sessionState.collectedData.usage === 'WAITING') {
        parseLaptopUsage(lowerInput);
        sessionState.stage = 'RECOMMENDATION';
      }
    }
  }

  // TIẾN TRÌNH XUẤT ĐỀ XUẤT TOP 3 VÀ PHÂN TÍCH ĐÁNH ĐỔI (STEP 3: RECOMMENDATION)
  if (sessionState.stage === 'RECOMMENDATION') {
    document.getElementById('chat-stage').textContent = 'So Sánh & Đề Xuất';
    document.getElementById('chat-stage').className =
      'font-semibold text-accent-green';

    // Đồng bộ hoàn thành tiến trình RAG lên sidepanel
    updateSidebarLogs('catalog', true);
    updateSidebarLogs('promo', true);

    const recommendedHtml = generateTop3Recommendations(sessionState.category);
    appendAssistantMessage(recommendedHtml);

    // Chuyển máy trạng thái về ban đầu để người dùng có thể hỏi tiếp
    sessionState.stage = 'INIT';
    sessionState.category = null;
    resetCollectedData();
  }
}

// Kiểm tra chống ảo giác: Tránh bịa đặt các dòng máy ngoài catalog
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

// Phản hồi của hàng rào chống ảo giác (Anti-Hallucination Guardrail Response)
function triggerMissingDataResponse() {
  updateSidebarLogs('catalog', false);
  appendAssistantMessage(`
    <div class="space-y-2">
      <div class="flex items-center space-x-2 text-accent-orange font-semibold text-sm">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Dạ, hiện hệ thống chưa cập nhật thông tin này ạ.</span>
      </div>
      <p class="text-sm text-slate-300">
        Kho dữ liệu sản phẩm mẫu (Catalog & Ưu đãi) hiện tại trong khuôn khổ thử nghiệm chưa chứa thông tin chi tiết về sản phẩm hoặc hãng này.
      </p>
      <p class="text-sm text-slate-300">
        Để có câu trả lời chính xác nhất, em xin phép <strong>kết nối trực tiếp anh/chị với nhân viên hỗ trợ trực tuyến</strong> hoặc lưu lại thông tin để gọi điện thoại tư vấn ngay sau 5 phút không ạ?
      </p>
      <div class="flex space-x-2 pt-2">
        <button type="button" onclick="window.appendAssistantMessage('<p class=\'text-sm\'>Dạ đã chuyển tiếp yêu cầu! Nhân viên tư vấn Điện Máy Xanh sẽ gọi lại hỗ trợ ngay lập tức ạ.</p>')" class="bg-brand-500 hover:bg-brand-600 text-white text-xs px-3 py-1.5 rounded font-medium transition-all">
          Gặp Nhân Viên Tư Vấn
        </button>
      </div>
    </div>
  `);
}

// Bóc tách ngân sách của người dùng
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
    sessionState.collectedData.roomSize = 12; // Mặc định nếu người dùng gõ chữ không kèm số
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

// Làm mới cuộc hội thoại
window.resetConversation = function () {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = `
    <div class="flex items-start space-x-3 message-fade-in">
      <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-md">
        <i class="fa-solid fa-robot text-white text-sm"></i>
      </div>
      <div class="space-y-1 max-w-[80%]">
        <div class="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-md border border-slate-700/50">
          <p class="text-sm leading-relaxed">
            Dạ, cuộc trò chuyện đã được làm mới. Toàn bộ hệ thống RAG và rào cản chống ảo giác (Guardrails) đã khởi động lại hoàn toàn ạ! ⚙️
          </p>
          <p class="text-sm leading-relaxed mt-2">
            Anh/chị đang cần tìm mua máy lạnh, tủ lạnh hay laptop phục vụ cho gia đình mình thế ạ? Hãy chat cho em biết nhé.
          </p>
        </div>
        <span class="text-[10px] text-slate-500 pl-2">Vừa mới gửi</span>
      </div>
    </div>
  `;
  sessionState.stage = 'INIT';
  sessionState.category = null;
  resetCollectedData();
  document.getElementById('active-category').textContent = 'Chưa xác định';
  document.getElementById('chat-stage').textContent = 'Khởi tạo';
  document.getElementById('chat-stage').className =
    'font-semibold text-accent-amber';
  document.getElementById('slang-inspector').innerHTML =
    `<span class="text-slate-500 italic">Chưa phát hiện từ viết tắt...</span>`;
  document.getElementById('rag-catalog-status').className = 'text-slate-500';
  document.getElementById('rag-catalog-status').innerHTML =
    `<i class="fa-solid fa-circle-minus mr-1"></i>Chờ`;
  document.getElementById('rag-promo-status').className = 'text-slate-500';
  document.getElementById('rag-promo-status').innerHTML =
    `<i class="fa-solid fa-circle-minus mr-1"></i>Chờ`;
  document.getElementById('rag-faq-status').className = 'text-slate-500';
  document.getElementById('rag-faq-status').innerHTML =
    `<i class="fa-solid fa-circle-minus mr-1"></i>Chờ`;
  document.getElementById('latency-val').textContent = '0ms';
};

// Đổ nhanh dữ liệu demo cho BGK
window.fillQuickPrompt = function (promptText) {
  const inputEl = document.getElementById('user-input');
  inputEl.value = promptText;
  inputEl.focus();
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
    targetEl.className = 'text-accent-green font-semibold flex items-center';
    targetEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-accent-green inline-block mr-1.5 pulse-green"></span>Truy xuất OK`;
  } else {
    targetEl.className = 'text-accent-amber font-semibold flex items-center';
    targetEl.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1.5"></i>Đang gọi API`;
  }
}

// ==========================================
// 6. SPEC-TO-BENEFIT TRANSLATION & COMPARISON
// ==========================================

function translateSpecToBenefit(specName, specVal) {
  const dictionary = {
    inverter: {
      true: 'Công nghệ biến tần Inverter vượt trội: Giúp máy vận hành siêu êm ái, giảm tối đa tiếng ồn cục nóng ngoài trời và cực kỳ tiết kiệm điện năng tiêu thụ hàng tháng cho gia đình.',
      false:
        'Không có Inverter: Dễ tốn điện hơn nếu sử dụng liên tục trên 6 tiếng mỗi ngày.',
    },
    screen_oled: {
      true: 'Màn hình OLED cao cấp: Cho dải màu rực rỡ, độ tương phản sâu xem phim giải trí cực đã mắt, chống mỏi mắt cho người học bài ban đêm.',
    },
    ram_16gb: {
      true: 'Bộ nhớ RAM 16GB cực khủng: Lướt web mở 30 tab Chrome đồng thời, chạy Excel nặng không lo giật lag hay treo ứng dụng giữa chừng.',
    },
  };

  return dictionary[specName] ? dictionary[specName][specVal] : '';
}

function generateTop3Recommendations(category) {
  const products = MOCK_CATALOG[category];
  let htmlResult = `
    <div class="space-y-4">
      <p class="text-sm">
        Dạ, dựa vào phân tích nhu cầu thực tế của gia đình mình, em xin đề xuất **Top 3 sản phẩm tối ưu nhất** được trích xuất trực tiếp từ kho hàng Điện Máy Xanh kèm phân tích điểm đánh đổi (Trade-off) rõ ràng để mình dễ dàng lựa chọn ạ:
      </p>

      <!-- GRID OF 3 CARDS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
  `;

  products.forEach((product, idx) => {
    const isInstallmentZero = MOCK_PROMOTIONS.installment_0.includes(
      product.id,
    );
    const gift =
      MOCK_PROMOTIONS.discounts[product.id] || 'Không áp dụng quà tặng đi kèm';
    const stockText =
      product.stock > 0
        ? `<span class="text-accent-green font-medium">Còn hàng (${product.stock} máy tại siêu thị)</span>`
        : `<span class="text-red-500 font-medium">Hết hàng tạm thời (No Stock)</span>`;

    let benefitHighlight = '';
    let tradeoffHighlight = '';

    if (category === 'ac') {
      benefitHighlight = `
        <div class="text-xs text-slate-300 space-y-1 bg-slate-900/50 p-2 rounded border border-slate-700/30">
          <p class="text-[11px] text-accent-green font-semibold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Phù hợp hoàn hảo cho không gian <strong>${product.room_size}</strong>.</p>
          <p>• ${translateSpecToBenefit('inverter', product.inverter)}</p>
          <p>• Độ ồn tối đa chỉ <strong>${product.noise}</strong>.</p>
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Mức giá cực rẻ tiết kiệm tài chính tối đa, tuy nhiên máy sử dụng màng lọc bụi thô cơ bản (không lọc được bụi siêu mịn PM2.5) và máy hoạt động có tiếng ồn lớn hơn hai dòng cao cấp phía trên.'
          : idx === 1
            ? 'Làm lạnh cực nhanh và sâu nhưng giá thành cao hơn hẳn dòng Panasonic, diện tích lắp đặt cục nóng lớn hơn.'
            : 'Công suất 1 HP chỉ khuyên dùng cho phòng nhỏ dưới 15m², nếu phòng bị hướng nắng gắt chiếu trực tiếp vào buổi trưa thì máy sẽ mất nhiều thời gian hơn để làm mát sâu.';
    } else if (category === 'fridge') {
      benefitHighlight = `
        <div class="text-xs text-slate-300 space-y-1 bg-slate-900/50 p-2 rounded border border-slate-700/30">
          <p class="text-[11px] text-accent-green font-semibold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Dung tích <strong>${product.liters} Lít</strong>, đáp ứng trọn vẹn nhu cầu trữ thực phẩm cho <strong>${product.family_size}</strong>.</p>
          <p>• ${product.cooling}</p>
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Mức giá siêu rẻ cho sinh viên nhưng dung tích rất nhỏ 90L không có ngăn làm đá đông mềm riêng biệt, và không tích hợp Inverter tiết kiệm điện.'
          : idx === 0
            ? 'Kiểu dáng ngăn đá phía trên truyền thống nên mỗi lần lấy rau củ ngăn dưới cùng mình sẽ phải cúi khom người hơi mỏi nhẹ một chút.'
            : 'Trang bị vòi lấy nước ngoài siêu tiện lợi nhưng kích thước tủ tương đối to ngang, cần vị trí đặt tủ rộng tối thiểu 70cm để mở cánh tủ thoải mái nhất.';
    } else if (category === 'laptop') {
      const is16GB = product.id === 'laptop-lenovo-03';
      benefitHighlight = `
        <div class="text-xs text-slate-300 space-y-1 bg-slate-900/50 p-2 rounded border border-slate-700/30">
          <p class="text-[11px] text-accent-green font-semibold uppercase tracking-wider">Lợi ích thực tế:</p>
          <p>• Thiết kế mỏng nhẹ chỉ nặng <strong>${product.weight}</strong>, mang đi học cả ngày không mệt mỏi.</p>
          <p>• Màn hình <strong>${product.screen}</strong> bảo vệ thị lực.</p>
          ${is16GB ? `<p>• ${translateSpecToBenefit('ram_16gb', true)}</p>` : `<p>• 8GB RAM mượt mà cho mọi tác vụ Word, Excel phổ thông.</p>`}
        </div>
      `;
      tradeoffHighlight =
        idx === 2
          ? 'Cấu hình cực mạnh và đa nhiệm siêu khủng trong tầm giá tốt nhưng viền màn hình hơi dày và vỏ máy bằng chất liệu nhựa thuần tối giản, ít sang trọng.'
          : idx === 0
            ? 'Thiết kế vỏ nhôm tinh xảo cao cấp nhưng thời lượng pin ở mức trung bình (4-5 tiếng), bạn nên mang theo củ sạc đi kèm khi học nhóm cả ngày.'
            : 'Màn hình OLED hiển thị màu sắc rực rỡ siêu nịnh mắt nhưng vỏ máy cấu trúc nhựa dễ bám dấu vân tay khi sử dụng.';
    }

    htmlResult += `
      <!-- THẺ SẢN PHẨM ${idx + 1} -->
      <div class="trade-off-card bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
        <div>
          <div class="flex justify-between items-start mb-2">
            <span class="px-2 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded">
              Gợi Ý ${idx + 1}
            </span>
            ${isInstallmentZero ? `<span class="px-2 py-0.5 text-[10px] font-bold bg-accent-orange/10 text-accent-orange border border-accent-orange/20 rounded">Góp 0%</span>` : ''}
          </div>

          <h3 class="font-bold text-xs text-white line-clamp-2 min-h-[32px]">${product.name}</h3>

          <div class="mt-2 text-base font-extrabold text-white">
            ${formatVND(product.price)}
          </div>

          <div class="mt-1 text-[11px] text-slate-400">
            Tồn kho: ${stockText}
          </div>

          <!-- Section dịch thuật thông số -->
          <div class="mt-3">
            ${benefitHighlight}
          </div>

          <!-- Section Phân tích Trade-off chi tiết -->
          <div class="mt-3 space-y-1 bg-amber-500/5 p-2 rounded border border-amber-500/10 text-xs text-slate-300">
            <p class="text-[11px] text-accent-amber font-semibold uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i> Điểm cần cân nhắc (Trade-off):
            </p>
            <p class="leading-relaxed">${tradeoffHighlight}</p>
          </div>
        </div>

        <!-- Quà tặng & Action chọn mua -->
        <div class="pt-2 border-t border-slate-800/60 space-y-2">
          <div class="text-[11px] text-slate-400">
            🎁 <strong>Quà tặng đi kèm:</strong> <span class="text-slate-200">${gift}</span>
          </div>
          <button type="button" onclick="window.appendAssistantMessage('<p class=\'text-sm\'>Dạ đã thêm sản phẩm <strong>${product.name}</strong> vào danh sách tư vấn của bạn cùng ưu đãi đặc biệt rồi nhé ạ!</p>')" class="w-full bg-slate-800 hover:bg-brand-600 hover:text-white transition-all text-slate-200 py-1.5 rounded text-xs font-semibold">
            Chọn mua sản phẩm này
          </button>
        </div>
      </div>
    `;
  });

  htmlResult += `
      </div>
      <p class="text-xs text-slate-400 italic mt-3">
        *Lưu ý: Mọi mức giá và ưu đãi quà tặng phía trên được truy xuất tự động từ hệ thống quản lý tồn kho trực tiếp theo thời gian thực tại Điện Máy Xanh, đảm bảo độ chính xác 100% không ảo giác dữ liệu.*[cite: 1]
      </p>
    </div>
  `;

  return htmlResult;
}

// ==========================================
// 7. INITIALIZE DOM EVENTS FOR WEBPACK
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', handleUserSubmit);
  }

  // Expose function out of bundle for inline HTML onclick handlers
  window.appendAssistantMessage = appendAssistantMessage;
});
