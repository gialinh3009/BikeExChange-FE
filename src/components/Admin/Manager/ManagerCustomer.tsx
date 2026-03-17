import { UserCircle } from "lucide-react";
import UnderDevelopment from "./UnderDevelopment";

export default function ManagerCustomer() {
  return (
    <UnderDevelopment
      title="Quản Lý Khách Hàng"
      description="Danh sách khách hàng và lịch sử mua hàng"
      icon={UserCircle}
    />
  );
}
