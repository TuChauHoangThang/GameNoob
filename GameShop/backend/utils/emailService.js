const nodemailer = require('nodemailer');

// ── Tạo transporter Gmail SMTP ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    // Gmail App Password cho phép có spaces — strip để chắc chắn
    pass: (process.env.EMAIL_PASSWORD || '').replace(/\s/g, ''),
  },
});

// ── Sinh mã OTP 6 chữ số ────────────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Template email OTP ──────────────────────────────────────────────────────
const getOtpEmailTemplate = (otp, purpose) => {
  const purposeText = {
    register: 'Xác Thực Tài Khoản',
    forgot: 'Đặt Lại Mật Khẩu',
  };

  const purposeDesc = {
    register: 'Cảm ơn bạn đã đăng ký tài khoản tại GameNoob! Vui lòng nhập mã OTP bên dưới để xác thực tài khoản của bạn.',
    forgot: 'Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhập mã OTP bên dưới để tiếp tục.',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);border-radius:16px;overflow:hidden;border:1px solid rgba(0,255,136,0.15);box-shadow:0 20px 60px rgba(0,0,0,0.5);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#00ff88 0%,#00b8ff 100%);padding:30px;text-align:center;">
      <h1 style="margin:0;color:#000;font-size:28px;font-weight:800;letter-spacing:2px;">🎮 GameNoob</h1>
      <p style="margin:8px 0 0;color:rgba(0,0,0,0.7);font-size:14px;font-weight:600;">${purposeText[purpose] || 'Xác Thực'}</p>
    </div>
    
    <!-- Body -->
    <div style="padding:40px 30px;">
      <p style="color:#c9d1d9;font-size:15px;line-height:1.6;margin:0 0 25px;">
        ${purposeDesc[purpose] || 'Vui lòng nhập mã OTP bên dưới.'}
      </p>
      
      <!-- OTP Code -->
      <div style="text-align:center;margin:30px 0;">
        <div style="display:inline-block;background:rgba(0,255,136,0.08);border:2px solid rgba(0,255,136,0.3);border-radius:12px;padding:20px 40px;">
          <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#00ff88;font-family:'Courier New',monospace;">${otp}</span>
        </div>
      </div>
      
      <p style="color:#8b949e;font-size:13px;text-align:center;margin:20px 0;">
        ⏰ Mã OTP có hiệu lực trong <strong style="color:#ff6b6b;">5 phút</strong>
      </p>
      
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:25px 0;">
      
      <p style="color:#6e7681;font-size:12px;line-height:1.5;margin:0;">
        ⚠️ Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này. Không chia sẻ mã OTP với bất kỳ ai.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background:rgba(0,0,0,0.3);padding:20px;text-align:center;">
      <p style="color:#484f58;font-size:11px;margin:0;">© 2026 GameNoob. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

// ── Gửi email OTP ───────────────────────────────────────────────────────────
const sendOtpEmail = async (email, otp, purpose = 'register') => {
  const subjectMap = {
    register: '🎮 GameNoob — Mã Xác Thực Tài Khoản',
    forgot: '🔐 GameNoob — Mã Đặt Lại Mật Khẩu',
  };

  const mailOptions = {
    from: `"GameNoob" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjectMap[purpose] || '🎮 GameNoob — Mã OTP',
    html: getOtpEmailTemplate(otp, purpose),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('❌ Lỗi gửi email OTP:', err.message);
    throw err;
  }
};

module.exports = { generateOTP, sendOtpEmail };
