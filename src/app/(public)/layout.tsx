import type { ReactNode } from "react";

// 랜딩(/)은 자체 패딩 관리, 진단 플로우는 표준 패딩 적용
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mobile-container">
      {children}
    </div>
  );
}
