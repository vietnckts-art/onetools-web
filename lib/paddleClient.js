import { initializePaddle } from "@paddle/paddle-js";

// Khởi tạo Paddle.js 1 lần duy nhất (singleton) — mọi nơi cần gọi Paddle (Checkout, PricePreview)
// đều import getPaddle() từ đây thay vì tự initializePaddle() riêng lẻ.
//
// QUAN TRỌNG: KHÔNG tự ý mặc định environment ("sandbox" hay "production") nếu thiếu biến môi
// trường — thà lỗi rõ ràng ngay còn hơn lỡ chạy nhầm sang tài khoản Paddle khác (VD: code test
// tưởng đang ở sandbox mà thật ra đang tạo giao dịch thật bên production).
let paddlePromise = null;

export function getPaddle() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

  if (!token || !environment) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_PADDLE_CLIENT_TOKEN hoặc NEXT_PUBLIC_PADDLE_ENVIRONMENT trong .env.local " +
        "(xem .env.example) — không tự chọn môi trường mặc định để tránh chạy nhầm tài khoản Paddle."
    );
  }
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error(
      `NEXT_PUBLIC_PADDLE_ENVIRONMENT="${environment}" không hợp lệ — chỉ nhận "sandbox" hoặc "production".`
    );
  }

  if (!paddlePromise) {
    paddlePromise = initializePaddle({ token, environment }).then((instance) => {
      if (!instance) {
        // initializePaddle trả undefined nếu token/environment sai — reset để lần gọi sau thử lại
        // thay vì kẹt mãi ở 1 promise hỏng.
        paddlePromise = null;
        throw new Error("Paddle.js không khởi tạo được — kiểm tra lại client-side token và environment.");
      }
      return instance;
    });
  }
  return paddlePromise;
}
