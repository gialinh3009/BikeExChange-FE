import { useState } from "react";
import { Search, Plus } from "lucide-react";

type PostStatus = "published" | "draft";

const MOCK_POSTS: { id: number; title: string; author: string; status: PostStatus; date: string }[] = [
  { id: 1, title: "Xe đạp địa hình Trek", author: "Nguyễn Văn A", status: "published", date: "2025-03-01" },
  { id: 2, title: "Hướng dẫn bảo dưỡng xe", author: "Trần Thị B", status: "draft", date: "2025-03-02" },
  { id: 3, title: "Top 10 xe đạp 2025", author: "Lê Văn C", status: "published", date: "2025-03-03" },
];

const STATUS_LABEL = {
  published: { label: "Đã đăng", color: "bg-green-100 text-green-700" },
  draft: { label: "Nháp", color: "bg-yellow-100 text-yellow-700" },
};

export default function ManagerPosts() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_POSTS.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản Lý Bài Viết</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách bài viết trên hệ thống</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800"
        >
          <Plus size={15} /> Thêm bài viết
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 w-full max-w-sm">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          className="flex-1 outline-none text-sm placeholder:text-gray-400"
          placeholder="Tìm bài viết..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-left">
              <th className="px-5 py-3 font-medium">Tiêu đề</th>
              <th className="px-5 py-3 font-medium">Tác giả</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
              <th className="px-5 py-3 font-medium">Ngày tạo</th>
              <th className="px-5 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.id} className="border-b border-gray-50 hover:bg-blue-50">
                <td className="px-5 py-3 font-medium text-gray-900">{post.title}</td>
                <td className="px-5 py-3 text-gray-600">{post.author}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[post.status].color}`}>
                    {STATUS_LABEL[post.status].label}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">{post.date}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-blue-600 hover:underline text-xs">Sửa</button>
                    <button type="button" className="text-red-500 hover:underline text-xs">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">Không tìm thấy bài viết</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}