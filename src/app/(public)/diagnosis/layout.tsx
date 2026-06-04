// 진단 플로우(Step1~3) 공통 레이아웃: 상하 여백 부여
export default function DiagnosisLayout({ children }: { children: React.ReactNode }) {
  return <div className="py-6">{children}</div>;
}
