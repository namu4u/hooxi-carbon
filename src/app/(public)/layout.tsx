import type { ReactNode } from "react";

// 랜딩(/)과 진단 플로우가 각자 레이아웃을 관리
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
