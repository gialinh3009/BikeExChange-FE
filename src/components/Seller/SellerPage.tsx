// Revert SellerPage to its original state
// ...existing code...
const stats = [
  { label: "Xe đang bán", value: "12", icon: "", color: "bg-blue-50 text-blue-600" },
  { label: "Đã bán", value: "34", icon: "", color: "bg-emerald-50 text-emerald-600" },
  { label: "Chờ kiểm định", value: "3", icon: "", color: "bg-amber-50 text-amber-600" },
  { label: "Doanh thu", value: "42.5M", icon: "", color: "bg-purple-50 text-purple-600" },
];

const listings = [
  { id: 1, name: "Trek FX 3 Disc", price: "8.500.000đ", status: "Đang bán", statusColor: "bg-emerald-100 text-emerald-700" },
  { id: 2, name: "Giant Escape 3", price: "6.200.000đ", status: "Chờ kiểm định", statusColor: "bg-amber-100 text-amber-700" },
  { id: 3, name: "Specialized Sirrus", price: "12.000.000đ", status: "Đang bán", statusColor: "bg-emerald-100 text-emerald-700" },
  { id: 4, name: "Cannondale Quick 4", price: "9.800.000đ", status: "Đã bán", statusColor: "bg-gray-100 text-gray-600" },
];

export default function SellerPage() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  return (
    <div>
      <h1>Seller Page</h1>
      <p>Role-specific content for sellers will be displayed here.</p>
    </div>
  );
}