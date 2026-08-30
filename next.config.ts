import type { NextConfig } from "next";

/**
 * Frontend (Vercel) và backend (Render) sống trên hai domain khác nhau, nên
 * cookie refresh_token (SameSite=None) rất dễ bị trình duyệt chặn theo chính
 * sách chặn cookie bên thứ ba — người dùng bị đăng xuất mỗi lần reload trang.
 *
 * Rewrite /api/* sang backend biến request thành same-origin dưới góc nhìn
 * của trình duyệt (chỉ nói chuyện với domain frontend); Vercel/Next.js mới là
 * bên gọi backend ở phía server, không bị CORS hay SameSite chi phối. Cookie
 * Set-Cookie từ backend vẫn được chuyển tiếp nguyên vẹn qua response.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
