// 결과 화면 레이아웃: 하단 고정 CTA 공간 포함
export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <div className="pt-6 pb-24">{children}</div>;
}
