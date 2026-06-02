/**
 * VNPay Payment Gateway Integration
 * Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */

const crypto = require('crypto');
// Dùng querystring built-in của Node — VNPay yêu cầu encode chuẩn
const qs = require('querystring');

const VNP_TMN_CODE    = process.env.VNPAY_TMN_CODE    || 'FCVGS4CJ';
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'HBIBX7OXGFP5XVCC5TD03F72ME3KHMNN';
const VNP_URL         = process.env.VNPAY_URL         || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL  = process.env.VNPAY_RETURN_URL  || 'http://localhost:5000/api/checkout/vnpay/return';

function createPaymentUrl({ orderId, amount, orderInfo, ipAddr, locale = 'vn' }) {
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  let vnpParams = {};
  vnpParams['vnp_Version']    = '2.1.0';
  vnpParams['vnp_Command']    = 'pay';
  vnpParams['vnp_TmnCode']    = VNP_TMN_CODE;
  vnpParams['vnp_Amount']     = String(Math.round(amount) * 100);
  vnpParams['vnp_CreateDate'] = createDate;
  vnpParams['vnp_CurrCode']   = 'VND';
  vnpParams['vnp_IpAddr']     = ipAddr || '127.0.0.1';
  vnpParams['vnp_Locale']     = locale;
  vnpParams['vnp_OrderInfo']  = orderInfo;
  vnpParams['vnp_OrderType']  = 'other';
  vnpParams['vnp_ReturnUrl']  = VNP_RETURN_URL;
  vnpParams['vnp_TxnRef']     = String(orderId);
  vnpParams['vnp_ExpireDate'] = expireDate;

  // Sort theo alphabet — bắt buộc theo VNPay docs
  vnpParams = sortObject(vnpParams);

  // Tạo chuỗi ký
  const signData = Object.keys(vnpParams)
    .map(key => `${key}=${vnpParams[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  // Build URL cuối cùng
  return VNP_URL + '?' + signData + '&vnp_SecureHash=' + signed;
}

function verifyReturnUrl(vnpParams) {
  let params = { ...vnpParams };
  const secureHash = params['vnp_SecureHash'];
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  // Keep a copy of decoded params for return fields
  const decodedParams = { ...params };

  // Sort and build signData — encode matching the createPaymentUrl
  params = sortObject(params);
  const signData = Object.keys(params)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = secureHash === signed;
  const rspCode = decodedParams['vnp_ResponseCode'];

  return {
    isValid,
    rspCode,
    txnRef:     decodedParams['vnp_TxnRef'],
    amount:     parseInt(decodedParams['vnp_Amount']) / 100,
    bankCode:   decodedParams['vnp_BankCode'],
    bankTranNo: decodedParams['vnp_BankTranNo'],
    transDate:  decodedParams['vnp_PayDate'],
    orderInfo:  decodedParams['vnp_OrderInfo'],
    message:    rspCode === '00' ? 'Giao dịch thành công' : (vnpResponseMessages[rspCode] || `Lỗi (${rspCode})`),
  };
}

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    const decodedKey = decodeURIComponent(str[key]);
    sorted[str[key]] = encodeURIComponent(obj[decodedKey]).replace(/%20/g, "+");
  }
  return sorted;
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

const vnpResponseMessages = {
  '00': 'Giao dịch thành công',
  '07': 'Giao dịch bị nghi ngờ.',
  '09': 'Thẻ chưa đăng ký InternetBanking.',
  '10': 'Xác thực sai quá 3 lần.',
  '11': 'Hết hạn chờ thanh toán.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Nhập sai OTP.',
  '24': 'Khách hàng hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Vượt hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi khác.',
};

module.exports = { createPaymentUrl, verifyReturnUrl };
