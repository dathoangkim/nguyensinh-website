document.addEventListener('DOMContentLoaded', function() {
    // Tạo các phần tử chat box
    createChatBox();
    
    // Xử lý sự kiện
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBox = document.querySelector('.chat-box');
    const closeChat = document.querySelector('.close-chat');
    const chatForm = document.querySelector('.chat-form');
    const chatInput = document.querySelector('.chat-input');
    const chatBody = document.querySelector('.chat-body');
    
    // Lưu trữ lịch sử hội thoại để gửi cho AI
    let conversationHistory = [];
    
    // Tạo session ID cho người dùng chưa đăng nhập
    let sessionId = localStorage.getItem('chat_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('chat_session_id', sessionId);
    }
    
    // Biến để theo dõi trạng thái đã hiển thị thông báo khuyến mãi hay chưa
    let promotionShown = false;
    
    // Mở/đóng chat box
    chatToggle.addEventListener('click', function() {
        chatBox.classList.add('active');
        
        // Hiển thị tin nhắn chào mừng nếu chưa có tin nhắn
        if (chatBody.children.length === 0) {
            setTimeout(() => {
                const welcomeMessage = 'Xin chào! Tôi là trợ lý AI của Nguyên Sinh. Tôi có thể giúp gì cho bạn về bánh mì, đặt hàng, hoặc thông tin cửa hàng?';
                addMessage(welcomeMessage, 'admin');
                conversationHistory.push({role: "assistant", content: welcomeMessage});
                
                // Kiểm tra và hiển thị thông báo khuyến mãi sau tin nhắn chào mừng
                if (!promotionShown) {
                    checkForPromotions();
                }
            }, 500);
        } else if (!promotionShown) {
            // Nếu đã có tin nhắn nhưng chưa hiển thị khuyến mãi
            checkForPromotions();
        }
    });
    
    closeChat.addEventListener('click', function() {
        chatBox.classList.remove('active');
    });
    
    // Xử lý gửi tin nhắn
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = chatInput.value.trim();
        
        if (message !== '') {
            // Thêm tin nhắn của người dùng
            addMessage(message, 'user');
            conversationHistory.push({role: "user", content: message});
            chatInput.value = '';
            
            // Hiển thị đang nhập...
            const typingIndicator = document.querySelector('.typing-indicator');
            typingIndicator.classList.add('active');
            
            // Gọi API AI để lấy phản hồi
            fetchAIResponse(message)
                .then(response => {
                    typingIndicator.classList.remove('active');
                    addMessage(response, 'admin');
                    conversationHistory.push({role: "assistant", content: response});
                })
                .catch(error => {
                    console.error('Error getting AI response:', error);
                    typingIndicator.classList.remove('active');
                    // Sử dụng phản hồi dự phòng nếu API không hoạt động
                    const fallbackResp = fallbackResponse(message);
                    addMessage(fallbackResp, 'admin');
                    conversationHistory.push({role: "assistant", content: fallbackResp});
                });
        }
    });
    
    // Lắng nghe sự kiện đăng nhập
    window.addEventListener('login', function() {
        console.log('User logged in, checking for promotions...');
        checkForPromotions();
    });
    
    // Lắng nghe sự kiện thêm vào giỏ hàng
    window.addEventListener('addToCart', function() {
        console.log('Item added to cart, checking for promotions...');
        checkForPromotions();
    });
    
    // Lắng nghe sự kiện đặt bàn
    window.addEventListener('reservation', function() {
        console.log('Table reserved, checking for promotions...');
        checkForPromotions();
    });
    
    // Cuộn xuống tin nhắn mới nhất
    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    // Thêm tin nhắn vào chat
    function addMessage(text, sender, isPromotion = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.classList.add(sender + '-message');
        
        if (isPromotion) {
            messageDiv.classList.add('promotion-message');
        }
        
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
        
        // Xử lý định dạng markdown đơn giản
        let formattedText = text;
        
        // Xử lý bold text (**text**)
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Xử lý italic text (*text*)
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Xử lý xuống dòng
        formattedText = formattedText.replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `
            ${formattedText}
            <span class="chat-time">${timeStr}</span>
        `;
        
        chatBody.appendChild(messageDiv);
        scrollToBottom();
        
        // Nếu là tin nhắn khuyến mãi, thêm hiệu ứng nhấp nháy
        if (isPromotion) {
            messageDiv.classList.add('highlight-animation');
            setTimeout(() => {
                messageDiv.classList.remove('highlight-animation');
            }, 3000);
        }
    }
    
    // Gọi API AI để lấy phản hồi
    async function fetchAIResponse(message) {
        try {
            // Kiểm tra xem người dùng đã đăng nhập chưa
            const token = localStorage.getItem('token');
            const endpoint = token 
                ? 'http://localhost:5000/api/chat/ai-response' 
                : 'http://localhost:5000/api/chat/public/ai-response';
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Thêm token vào header nếu có
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    message,
                    history: conversationHistory.slice(-6), // Chỉ gửi 6 tin nhắn gần nhất để giảm kích thước request
                    sessionId: token ? null : sessionId // Gửi sessionId nếu không có token
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                
                if (response.status === 500 && errorData.message) {
                    return `Xin lỗi, hệ thống AI đang gặp sự cố: ${errorData.message}. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua số điện thoại 08.1942.1942.`;
                }
                
                throw new Error(errorData.message || 'Network response was not ok');
            }
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error:', error);
            return fallbackResponse(message);
        }
    }
    
    // Kiểm tra và hiển thị thông báo khuyến mãi
    async function checkForPromotions() {
        try {
            // Kiểm tra xem người dùng đã đăng nhập chưa
            const token = localStorage.getItem('token');
            const endpoint = token 
                ? 'http://localhost:5000/api/chat/promotion' 
                : 'http://localhost:5000/api/chat/public/promotion';
            
            const headers = {};
            
            // Thêm token vào header nếu có
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Nếu có thông báo khuyến mãi, hiển thị sau 1 giây
            if (data.success && data.data.hasPromotion) {
                setTimeout(() => {
                    addMessage(data.data.message, 'admin', true);
                    conversationHistory.push({role: "assistant", content: data.data.message});
                    promotionShown = true;
                    
                    // Hiển thị thông báo nhỏ bên ngoài chat box
                    showPromotionNotification();
                }, 1000);
            }
        } catch (error) {
            console.error('Error checking for promotions:', error);
        }
    }
    
    // Hiển thị thông báo nhỏ về khuyến mãi
    function showPromotionNotification() {
        // Kiểm tra xem chat box có đang mở không
        if (!chatBox.classList.contains('active')) {
            // Tạo thông báo
            const notification = document.createElement('div');
            notification.className = 'chat-notification';
            notification.innerHTML = `
                <i class="fas fa-gift"></i>
                <span>Bạn có mã khuyến mãi mới!</span>
            `;
            
            // Thêm vào chat toggle
            const chatToggle = document.querySelector('.chat-toggle');
            chatToggle.appendChild(notification);
            
            // Thêm hiệu ứng nhấp nháy cho nút chat
            chatToggle.classList.add('notification-animation');
            
            // Xóa thông báo sau 5 giây
            setTimeout(() => {
                if (notification.parentNode === chatToggle) {
                    chatToggle.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    // Phản hồi dự phòng trong trường hợp không kết nối được với API
    function fallbackResponse(message) {
        message = message.toLowerCase();
        
        if (message.includes('xin chào') || message.includes('hello') || message.includes('hi')) {
            return 'Xin chào! Chúng tôi có thể giúp gì cho bạn?';
        } 
        else if (message.includes('giờ mở cửa') || message.includes('thời gian')) {
            return 'Cửa hàng chúng tôi mở cửa từ 7:00 - 21:00 hàng ngày.';
        }
        else if (message.includes('địa chỉ') || message.includes('cửa hàng') || message.includes('chi nhánh')) {
            return 'Chi nhánh chính: 141 Trần Đình Xu, Quận 1, TP.HCM. Bạn có thể xem thêm các chi nhánh khác tại mục Cửa Hàng trên website.';
        }
        else if (message.includes('đặt hàng') || message.includes('giao hàng')) {
            return 'Bạn có thể đặt hàng trực tuyến qua website hoặc gọi số 08.1942.1942. Chúng tôi giao hàng trong phạm vi 5km với đơn hàng từ 100.000đ.';
        }
        else if (message.includes('bánh mì') || message.includes('thực đơn') || message.includes('menu')) {
            return 'Bạn có thể xem thực đơn đầy đủ của chúng tôi tại mục Thực Đơn. Sản phẩm nổi bật nhất là Bánh Mì Pate Thịt Nguội - công thức gia truyền từ 1942.';
        }
        else if (message.includes('đặt bàn') || message.includes('reservation')) {
            return 'Để đặt bàn, bạn có thể gọi số 08.1942.1942 hoặc đặt trực tuyến qua website của chúng tôi tại mục Đặt Bàn.';
        }
        else if (message.includes('cảm ơn')) {
            return 'Không có gì! Rất vui được phục vụ bạn.';
        }
        else if (message.includes('khuyến mãi') || message.includes('giảm giá') || message.includes('coupon')) {
            return 'Chúng tôi thường xuyên có các chương trình khuyến mãi. Vui lòng theo dõi website hoặc fanpage của chúng tôi để cập nhật thông tin mới nhất.';
        }
        else {
            return 'Cảm ơn bạn đã liên hệ. Để được hỗ trợ nhanh nhất, vui lòng gọi số 08.1942.1942 hoặc để lại số điện thoại, chúng tôi sẽ liên hệ lại ngay.';
        }
    }
    
    // Tạo session ID ngẫu nhiên
    function generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Kiểm tra khuyến mãi khi trang web được tải
    setTimeout(checkForPromotions, 2000);
});

// Tạo cấu trúc HTML cho chat box
function createChatBox() {
    const chatBoxHTML = `
        <div class="chat-toggle">
            <i class="fas fa-robot"></i>
        </div>
        
        <div class="chat-box">
            <div class="chat-header">
                <h3><i class="fas fa-robot"></i> Trợ lý AI Nguyên Sinh</h3>
                <span class="close-chat"><i class="fas fa-times"></i></span>
            </div>
            
            <div class="chat-body">
                <div class="typing-indicator">Đang nhập...</div>
            </div>
            
            <form class="chat-footer chat-form">
                <input type="text" class="chat-input" placeholder="Nhập tin nhắn..." required>
                <button type="submit"><i class="fas fa-paper-plane"></i></button>
            </form>
        </div>
    `;
    
    const chatContainer = document.createElement('div');
    chatContainer.classList.add('chat-container');
    chatContainer.innerHTML = chatBoxHTML;
    
    document.body.appendChild(chatContainer);
}
