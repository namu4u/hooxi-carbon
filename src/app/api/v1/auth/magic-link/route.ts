import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";
import type { ApiResponse } from "@/types";

const LINK_EXPIRY_MINUTES = 30;

export async function POST(request: NextRequest) {
  try {
    const { leadId, email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "유효한 이메일을 입력해주세요", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "lead_id 가 필요합니다", code: "MISSING_LEAD_ID" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // 기존 미사용 토큰 만료 처리 (재발급 전 정리)
    await supabase
      .from("magic_links")
      .update({ used_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .is("used_at", null)
      .lt("expires_at", new Date().toISOString());

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("magic_links")
      .insert({ lead_id: leadId, token, expires_at: expiresAt });

    if (error) {
      console.error("[magic-link/POST] DB error:", error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "링크 생성 실패", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    const magicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/auth?token=${token}`;

    // TODO: Stibee API 호출로 이메일 발송
    console.log("[magic-link] URL:", magicUrl);

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error("[magic-link/POST]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "요청 처리 실패", code: "REQUEST_ERROR" },
      { status: 500 }
    );
  }
}

// 매직링크 검증 엔드포인트
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "토큰이 없습니다", code: "MISSING_TOKEN" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const { data: link, error } = await supabase
      .from("magic_links")
      .select("id, lead_id, expires_at, used_at")
      .eq("token", token)
      .single();

    if (error || !link) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "유효하지 않은 링크입니다", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    if (link.used_at) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "이미 사용된 링크입니다", code: "TOKEN_USED" },
        { status: 401 }
      );
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "링크가 만료됐습니다", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    // 토큰 사용 처리
    await supabase
      .from("magic_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", link.id);

    return NextResponse.json<ApiResponse<{ leadId: string }>>({
      success: true,
      data: { leadId: link.lead_id },
    });
  } catch (err) {
    console.error("[magic-link/GET]", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "요청 처리 실패", code: "REQUEST_ERROR" },
      { status: 500 }
    );
  }
}
