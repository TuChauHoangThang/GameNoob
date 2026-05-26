require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    console.log(`[Connecting] Kết nối tới database "${process.env.DB_NAME}" trên cổng ${process.env.DB_PORT}...`);
    
    // 1. Kiểm tra xem bảng users có tồn tại không
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("[-] Không tìm thấy bảng 'users' trong database.");
      return;
    }
    
    console.log("[+] Đã tìm thấy bảng 'users'!");

    // 2. Kiểm tra xem cột is_admin có tồn tại trong bảng users hay chưa
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin';
    `);

    if (columnCheck.rows.length === 0) {
      console.log("[-] Cột 'is_admin' chưa tồn tại trong bảng 'users'.");
      console.log("[Action] Tiến hành tự động tạo cột 'is_admin' với định dạng BOOLEAN (mặc định là FALSE)...");
      
      await pool.query("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;");
      console.log("[SUCCESS] Đã tạo thành công cột 'is_admin'!");
    } else {
      console.log("[+] Cột 'is_admin' đã tồn tại sẵn trong bảng 'users'.");
    }

    // 3. Lấy danh sách users hiện tại
    const usersResult = await pool.query("SELECT id, username, email, is_admin, created_at FROM users ORDER BY id ASC");
    
    if (usersResult.rows.length === 0) {
      console.log("[-] Bảng 'users' hiện tại đang rỗng. Chưa có tài khoản nào đăng ký.");
      return;
    }
    
    console.log("\n=== DANH SÁCH TÀI KHOẢN HIỆN TẠI TRONG DATABASE ===");
    console.table(usersResult.rows.map(u => ({
      ID: u.id,
      "Tên tài khoản": u.username,
      "Địa chỉ Email": u.email,
      "Quyền Admin": u.is_admin ? "✅ YES (ADMIN)" : "❌ NO (USER)",
      "Ngày tạo": u.created_at
    })));

    // 4. Kiểm tra xem có tài khoản Admin nào chưa
    const admins = usersResult.rows.filter(u => u.is_admin === true);
    
    if (admins.length > 0) {
      console.log(`\n[+] Hiện tại đang có ${admins.length} tài khoản có quyền Admin:`);
      admins.forEach(a => console.log(`  - Username: ${a.username} (${a.email})`));
      console.log("\n=> Bạn có thể đăng nhập bằng một trong các tài khoản trên để vào trang Admin!");
    } else {
      console.log("\n[-] Hiện chưa có tài khoản nào được cấp quyền Admin.");
      
      // Tìm tài khoản phù hợp để tự động cấp quyền
      // Ưu tiên tài khoản của bạn Hùng dựa trên email commit: 22130092@st.hcmuaf.edu.vn hoặc tài khoản đầu tiên
      let targetUser = usersResult.rows.find(u => u.email.includes('22130092'));
      if (!targetUser) {
        targetUser = usersResult.rows[0];
      }
      
      if (targetUser) {
        console.log(`[Action] Tiến hành tự động cấp quyền Admin cho tài khoản: "${targetUser.username}" (${targetUser.email})...`);
        const updateResult = await pool.query(
          "UPDATE users SET is_admin = true WHERE id = $1 RETURNING id, username, email, is_admin",
          [targetUser.id]
        );
        if (updateResult.rows[0]) {
          console.log(`\n[SUCCESS] Đã cấp quyền Admin thành công!`);
          console.log(`  - Tài khoản: ${updateResult.rows[0].username}`);
          console.log(`  - Email: ${updateResult.rows[0].email}`);
          console.log(`  - Quyền Admin: ${updateResult.rows[0].is_admin ? "✅ HOẠT ĐỘNG" : "❌ THẤT BẠI"}`);
          console.log("\n=> Bây giờ bạn hãy đăng nhập bằng tài khoản này trên trang web và bấm nút 'Quản trị' trên Navbar nhé!");
        }
      }
    }
  } catch (err) {
    console.error("[ERROR] Lỗi vận hành database:", err.message);
  } finally {
    await pool.end();
  }
}

run();
