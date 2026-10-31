import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";

export async function POST(): Promise<NextResponse> {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ success: false, error: "AI configuration is managed by the service." }, { status: 410 });
}
