import { Clock, User, Tag, ArrowRight, BookOpen } from "lucide-react";

const POSTS = [
  {
    id: 1,
    title: "5 lý do nên chọn xe đạp địa hình cho người mới bắt đầu",
    excerpt:
      "Xe đạp địa hình (MTB) không chỉ dành cho các đường mòn gồ ghề — chúng còn là lựa chọn tuyệt vời cho người mới vì độ bền, khả năng kiểm soát và sự linh hoạt trên nhiều địa hình khác nhau.",
    category: "Hướng dẫn",
    categoryColor: "blue",
    author: "Minh Tuấn",
    date: "10 tháng 3, 2026",
    readTime: "5 phút đọc",
    emoji: "🚵",
    featured: true,
  },
  {
    id: 2,
    title: "Cách bảo dưỡng xe đạp đúng cách để tăng tuổi thọ",
    excerpt:
      "Vệ sinh và bôi trơn định kỳ là bí quyết giữ xe luôn trơn tru. Bài viết hướng dẫn chi tiết từng bước bảo dưỡng mà bạn có thể tự thực hiện tại nhà.",
    category: "Bảo dưỡng",
    categoryColor: "green",
    author: "Thảo Nguyên",
    date: "6 tháng 3, 2026",
    readTime: "7 phút đọc",
    emoji: "🔧",
    featured: false,
  },
  {
    id: 3,
    title: "So sánh: Xe đạp carbon vs nhôm — nên chọn loại nào?",
    excerpt:
      "Carbon nhẹ hơn nhưng đắt hơn, trong khi nhôm bền và giá hợp lý. Hãy cùng phân tích ưu nhược điểm để bạn đưa ra quyết định phù hợp với ngân sách và mục đích sử dụng.",
    category: "Đánh giá",
    categoryColor: "purple",
    author: "Quang Hải",
    date: "1 tháng 3, 2026",
    readTime: "8 phút đọc",
    emoji: "⚖️",
    featured: false,
  },
  {
    id: 4,
    title: "Top 10 cung đường đạp xe đẹp nhất Việt Nam năm 2026",
    excerpt:
      "Từ đèo Hải Vân hùng vĩ đến những con đường làng thơ mộng ở Ninh Bình — đây là những cung đường mà bất kỳ cyclist nào cũng nên thử một lần trong đời.",
    category: "Trải nghiệm",
    categoryColor: "orange",
    author: "Hương Giang",
    date: "25 tháng 2, 2026",
    readTime: "6 phút đọc",
    emoji: "🗺️",
    featured: false,
  },
];

const categoryColors = {
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  green: { bg: "bg-green-100", text: "text-green-700" },
  purple: { bg: "bg-purple-100", text: "text-purple-700" },
  orange: { bg: "bg-orange-100", text: "text-orange-700" },
};

export default function Blogs() {
  const [featured, ...rest] = POSTS;

  return (
    <section id="blog" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Blog
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Kiến thức &{" "}
              <span className="text-blue-600">Cảm hứng</span>
            </h2>
            <p className="text-gray-500 mt-2">
              Khám phá thế giới xe đạp qua những bài viết được tuyển chọn.
            </p>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
          >
            Xem tất cả bài viết
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Featured post */}
          <div className="lg:col-span-2 group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 flex flex-col justify-between text-white cursor-pointer hover:shadow-xl hover:shadow-blue-200 transition-all duration-300">
            <div>
              <div className="text-6xl mb-4 group-hover:scale-105 transition-transform">{featured.emoji}</div>
              <span
                className={`inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-white/20`}
              >
                ✨ Nổi bật
              </span>
              <h3 className="text-xl font-bold leading-snug mb-3 group-hover:text-yellow-200 transition-colors">
                {featured.title}
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed line-clamp-4">{featured.excerpt}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-sm text-blue-200">
              <span className="flex items-center gap-1.5">
                <User size={13} />
                {featured.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {featured.readTime}
              </span>
            </div>
          </div>

          {/* Other posts */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {rest.map((post) => {
              const colors = categoryColors[post.categoryColor];
              return (
                <div
                  key={post.id}
                  className="group flex gap-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all duration-300"
                >
                  {/* Emoji thumbnail */}
                  <div className="shrink-0 w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                    {post.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`${colors.bg} ${colors.text} text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1`}
                      >
                        <Tag size={10} />
                        {post.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {post.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {post.readTime}
                      </span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className="shrink-0 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all self-center"
                  />
                </div>
              );
            })}

            {/* Newsletter mini-card */}
            <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="shrink-0 bg-blue-600 text-white p-2.5 rounded-xl">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Nhận bài viết mới nhất</p>
                <p className="text-gray-500 text-xs">Đăng ký nhận bản tin hàng tuần miễn phí</p>
              </div>
              <button className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
