// backend/utils/emailRegister.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendRegisterOTP = async (to, otp) => {
  await resend.emails.send({
    from: `"REAL TIME CHAT" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Mã Xác Thực OTP - Đăng Nhập Tài Khoản",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: white;
            letter-spacing: 8px;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          }
          .otp-label {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-text {
            color: #856404;
            font-size: 14px;
            margin: 0;
          }
          .info-box {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            color: #666;
            font-size: 14px;
          }
          .info-icon {
            margin-right: 10px;
            font-size: 18px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #999;
            font-size: 13px;
            line-height: 1.6;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #ddd, transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Xác Thực Tài Khoản</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Xin chào,</p>
            
            <p class="message">
              Chúng tôi đã nhận được yêu cầu đăng ký tài khoản của bạn. 
              Để đảm bảo an toàn, vui lòng sử dụng mã OTP bên dưới để hoàn tất quá trình xác thực.
            </p>
            
            <div class="otp-box">
              <p class="otp-label">Mã OTP của bạn</p>
              <p class="otp-code">${otp}</p>
            </div>
            
            <div class="warning">
              <p class="warning-text">
                ⏰ <strong>Lưu ý quan trọng:</strong> Mã OTP này chỉ có hiệu lực trong <strong>5 phút</strong> 
                kể từ thời điểm gửi email này.
              </p>
            </div>
            
            <div class="info-box">
              <div class="info-item">
                <span class="info-icon">🔒</span>
                <span>Không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên hỗ trợ</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⚠️</span>
                <span>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email</span>
              </div>
              <div class="info-item">
                <span class="info-icon">📧</span>
                <span>Email này được gửi tự động, vui lòng không trả lời</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <p class="message" style="margin-bottom: 10px;">
              Nếu bạn gặp bất kỳ vấn đề nào hoặc cần hỗ trợ, đừng ngần ngại liên hệ với 
              đội ngũ chăm sóc khách hàng của chúng tôi.
            </p>
            
            <p class="message" style="margin-top: 20px; color: #333; font-weight: 500;">
              Trân trọng,<br>
              Đội ngũ Real Time Chat
            </p>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống bảo mật của chúng tôi.</p>
            <p>
              © 2025 Real Time Chat App. All rights reserved.<br>
              <a href="https://realtimechat.online">realtimechat.com</a> | 
              <a href="https://realtimechat.online/support">Trung tâm hỗ trợ</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};
