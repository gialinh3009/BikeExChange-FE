import { BarChart2 } from "lucide-react";
import UnderDevelopment from "./UnderDevelopment";

export default function ManagerReport() {
  return (
    <UnderDevelopment
      title="Quản Lý Báo Cáo"
      description="Tổng hợp doanh thu và hiệu suất kinh doanh"
      icon={BarChart2}
    />
  );
}