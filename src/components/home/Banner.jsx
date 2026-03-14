import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, Star, Wrench } from "lucide-react";

const badges = [
  { icon: ShieldCheck, text: "Kiểm định chất lượng" },
  { icon: Truck, text: "Giao hàng toàn quốc" },
  { icon: Star, text: "Uy tín hàng đầu" },
  { icon: Wrench, text: "Bảo hành chính hãng" },
];

export default function Banner() {
  const navigate = useNavigate();

  return (
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-white/[0.03] rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-sm px-4 py-1.5 rounded-full backdrop-blur-sm">
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                <span>Sàn xe đạp second-hand #1 Việt Nam</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                Tìm chiếc xe{" "}
                <span className="text-yellow-300">hoàn hảo</span>
                <br />
                dành cho bạn
              </h1>

              <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
                Hàng ngàn xe đạp chất lượng cao được kiểm định kỹ lưỡng — từ xe địa hình, đường trường đến xe đô thị.
                Mua bán an toàn, uy tín, tiện lợi.
              </p>


              {/* Badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                {badges.map(({ icon: Icon, text }) => (
                    <div
                        key={text}
                        className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg text-sm text-blue-100"
                    >
                      <Icon size={14} className="text-yellow-300" />
                      {text}
                    </div>
                ))}
              </div>
            </div>

            {/* Right — illustration */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex flex-col items-center justify-center gap-4 p-8">
                  <div className="text-8xl">🚴</div>
                  <p className="text-white font-semibold text-lg text-center">
                    Mua bán xe đạp<br />đã qua sử dụng
                  </p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-300 fill-yellow-300" />
                    ))}
                  </div>
                  <span className="text-blue-200 text-sm text-center">Nền tảng uy tín — giao dịch an toàn</span>
                </div>
              </div>
            </div>
          </div>
          {/* Stats block đã bỏ — thay bằng section xe kiểm định bên dưới */}
        </div>
      </section>
  );
}