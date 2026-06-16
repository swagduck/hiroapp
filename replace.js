const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!code.includes('sonner')) {
  code = code.replace('import { useState, useEffect, useRef } from "react";', 'import { useState, useEffect, useRef } from "react";\nimport { toast } from "sonner";');
}

code = code.replace(/alert\("Có lỗi khi kết thúc phiên!"\)/g, 'toast.error("Có lỗi khi kết thúc phiên!")');
code = code.replace(/alert\(`Bảo lưu thành công \$\{data.savedMinutes\} phút!`\)/g, 'toast.success(`Bảo lưu thành công ${data.savedMinutes} phút!`)');
code = code.replace(/alert\(data.error \|\| "Có lỗi xảy ra"\)/g, 'toast.error(data.error || "Có lỗi xảy ra")');
code = code.replace(/alert\("Lỗi hệ thống khi bảo lưu"\)/g, 'toast.error("Lỗi hệ thống khi bảo lưu")');
code = code.replace(/alert\("Lỗi kiểm tra giờ bảo lưu"\)/g, 'toast.error("Lỗi kiểm tra giờ bảo lưu")');
code = code.replace(/alert\("Đã duyệt đơn và bắt đầu tính giờ!"\)/g, 'toast.success("Đã duyệt đơn và bắt đầu tính giờ!")');
code = code.replace(/alert\("Có lỗi xảy ra khi duyệt"\)/g, 'toast.error("Có lỗi xảy ra khi duyệt")');
code = code.replace(/alert\("Lỗi kết nối"\)/g, 'toast.error("Lỗi kết nối")');
code = code.replace(/alert\(`Tạo phiên thành công bằng giờ bảo lưu! Mã truy cập: \$\{data.accessCode\}`\)/g, 'toast.success(`Tạo phiên thành công bằng giờ bảo lưu! Mã truy cập: ${data.accessCode}`)');
code = code.replace(/alert\("Lỗi khi tạo phiên bằng giờ bảo lưu"\)/g, 'toast.error("Lỗi khi tạo phiên bằng giờ bảo lưu")');
code = code.replace(/alert\("Có lỗi tạo phiên"\)/g, 'toast.error("Có lỗi tạo phiên")');

fs.writeFileSync('src/app/page.tsx', code);
console.log("Done");
