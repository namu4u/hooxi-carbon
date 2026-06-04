"use client";

import { CheckIcon } from "lucide-react";

const STEPS = [
  { n: 1, label: "설비 정보" },
  { n: 2, label: "기업 규모" },
  { n: 3, label: "결과 확인" },
  { n: 4, label: "연락처" },
] as const;

interface Props {
  step: 1 | 2 | 3 | 4;
}

export function DiagnosisProgress({ step }: Props) {
  return (
    <div className="pb-6">
      {/* 상단 텍스트 */}
      <p className="text-xs text-muted-foreground mb-3 text-right">
        {step} / {STEPS.length} 단계
      </p>

      {/* 스텝 바 */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done    = s.n < step;
          const current = s.n === step;
          return (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              {/* 원형 인디케이터 */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                    done    ? "bg-primary border-primary text-white"           : "",
                    current ? "bg-white border-primary text-primary"           : "",
                    !done && !current ? "bg-white border-border text-muted-foreground" : "",
                  ].join(" ")}
                >
                  {done ? <CheckIcon className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span
                  className={[
                    "text-[10px] whitespace-nowrap",
                    current ? "text-primary font-semibold" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {s.label}
                </span>
              </div>

              {/* 연결선 (마지막 아이템 제외) */}
              {i < STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-0.5 mx-1 mb-4 transition-colors",
                    done ? "bg-primary" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
