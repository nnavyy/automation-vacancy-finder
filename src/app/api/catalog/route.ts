import { NextRequest, NextResponse } from "next/server";
import {
  ROLES,
  SKILLS,
  KEYWORDS_RU,
  EXCLUDE_KEYWORDS,
  RED_FLAG_KEYWORDS,
  CatalogItem,
} from "@/lib/catalog/data";
import { searchCatalog } from "@/lib/catalog/search";
import { getDynamicCatalogTerms, mergeCatalogs } from "@/lib/catalog/dynamic";

const STATIC_CATALOGS: Record<string, CatalogItem[]> = {
  roles: ROLES,
  skills: SKILLS,
  keywords_ru: KEYWORDS_RU,
  keywords_en: ROLES, // or SKILLS
  exclude: EXCLUDE_KEYWORDS,
  red_flags: RED_FLAG_KEYWORDS,
  red_flag: RED_FLAG_KEYWORDS,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "roles";
    const q = searchParams.get("q") || "";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const staticList = STATIC_CATALOGS[category] || ROLES;
    const dynamicList = await getDynamicCatalogTerms(category, 50);
    const combined = mergeCatalogs(staticList, dynamicList);

    const results = searchCatalog(combined, q, { limit });

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (err) {
    console.error("[GET /api/catalog] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch catalog suggestions" },
      { status: 500 }
    );
  }
}
