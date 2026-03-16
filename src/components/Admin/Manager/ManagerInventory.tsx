import { Package } from "lucide-react";
import UnderDevelopment from "./UnderDevelopment";

export default function ManagerInventory() {
  return (
    <UnderDevelopment
      title="Quản Lý Tồn Kho"
      description="Theo dõi số lượng và trạng thái hàng hóa"
      icon={Package}
    />
  );
}