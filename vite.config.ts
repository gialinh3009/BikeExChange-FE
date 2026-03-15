import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * VNPay return interceptor:
 * BE hardcodes vnp_ReturnUrl = http://localhost:5173/api/vnpay/vnpay-payment-return
 * → Vite runs on 5173 and redirects that path to /payment-success (keeping all query params)
 */
const vnpayReturnPlugin: Plugin = {
  name: 'vnpay-return-intercept',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/api/vnpay/vnpay-payment-return')) {
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(302, { Location: `/payment-success${qs}` });
        res.end();
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), vnpayReturnPlugin],
  server: {
    port: 5173,
    strictPort: false,
  },
})
