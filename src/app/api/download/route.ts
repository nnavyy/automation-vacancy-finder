import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Source downloads are not available on this hosted service." }, { status: 410 });
}
