import { Users } from "lucide-react";
import UnderDevelopment from "./UnderDevelopment";

export default function ManagerStaff() {
  return (
    <UnderDevelopment
      title="Quản Lý Nhân Viên"
      description="Danh sách nhân viên trong hệ thống"
      icon={Users}
    />
  );
}