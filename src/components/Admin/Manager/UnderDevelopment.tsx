import { type LucideIcon, Wrench } from "lucide-react";

interface UnderDevelopmentProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function UnderDevelopment({
  title,
  description,
  icon: Icon = Wrench,
}: UnderDevelopmentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Under development notice */}
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center">
        <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
          <Icon size={32} className="text-orange-500" />
        </div>

        <h2 className="mb-2 text-lg font-semibold text-gray-800">
          Tính năng đang phát triển
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-gray-500">
          Trang <span className="font-medium text-gray-700">{title}</span> hiện
          chưa hoàn thiện. Chúng tôi đang tích hợp API và hoàn thiện giao diện
          — vui lòng quay lại sau.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-medium text-orange-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
          Đang phát triển
        </div>
      </div>
    </div>
  );
}
