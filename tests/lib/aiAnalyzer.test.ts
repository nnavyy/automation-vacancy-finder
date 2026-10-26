import { describe, it, expect } from "vitest";
import { parseAIResponse } from "@/lib/aiAnalyzer";

describe("parseAIResponse", () => {
  it("parses clean JSON response correctly", () => {
    const raw = JSON.stringify({
      match_score: 85,
      recommendation: "apply",
      best_language: "english",
      summary: "Strong match for frontend stack.",
      match_reasons: ["React experience", "Remote friendly"],
      missing_requirements: ["GraphQL"],
      red_flags: [],
      cover_letter: "Dear Hiring Team,\n\nI am excited to apply...",
      questions_to_recruiter: ["What is the team size?"],
      confidence: 90,
    });

    const parsed = parseAIResponse(raw);
    expect(parsed.match_score).toBe(85);
    expect(parsed.recommendation).toBe("apply");
    expect(parsed.best_language).toBe("english");
    expect(parsed.match_reasons).toHaveLength(2);
    expect(parsed.confidence).toBe(90);
  });

  it("strips markdown code fences (```json ... ```)", () => {
    const raw = `
Here is the requested analysis:
\`\`\`json
{
  "match_score": 78,
  "recommendation": "apply",
  "summary": "Solid React fit.",
  "cover_letter": "Hello!"
}
\`\`\`
Hope this helps!
    `;

    const parsed = parseAIResponse(raw);
    expect(parsed.match_score).toBe(78);
    expect(parsed.recommendation).toBe("apply");
    expect(parsed.summary).toBe("Solid React fit.");
  });

  it("strips DeepSeek / Qwen <think>...</think> reasoning blocks", () => {
    const raw = `
<think>
The candidate has 2 years of experience with React.
The vacancy requires 1-3 years. This matches well.
I will assign a score of 82.
</think>
\`\`\`json
{
  "match_score": 82,
  "recommendation": "apply",
  "summary": "Well suited for this position.",
  "confidence": 85
}
\`\`\`
    `;

    const parsed = parseAIResponse(raw);
    expect(parsed.match_score).toBe(82);
    expect(parsed.recommendation).toBe("apply");
    expect(parsed.confidence).toBe(85);
  });

  it("handles string percentage in match_score and clamps values", () => {
    const raw = JSON.stringify({
      match_score: "120%",
      confidence: -10,
      recommendation: "unknown_value",
    });

    const parsed = parseAIResponse(raw);
    expect(parsed.match_score).toBe(100); // clamped to 100
    expect(parsed.confidence).toBe(0); // clamped to 0
    expect(parsed.recommendation).toBe("maybe"); // fallback default
  });

  it("parses Stage 1 compact JSON without cover_letter and defaults safely", () => {
    const compactRaw = JSON.stringify({
      match_score: 92,
      recommendation: "apply",
      best_language: "russian",
      summary: "High match on core TypeScript skills.",
      match_reasons: ["5+ years TypeScript", "Next.js App Router"],
      missing_requirements: [],
      red_flags: [],
      questions_to_recruiter: [],
      confidence: 95,
    });

    const parsed = parseAIResponse(compactRaw);
    expect(parsed.match_score).toBe(92);
    expect(parsed.cover_letter).toBe("");
    expect(parsed.recommendation).toBe("apply");
    expect(parsed.best_language).toBe("russian");
  });

  it("throws descriptive error when JSON is completely invalid", () => {
    const malformed = "This is just random text with no JSON object at all.";
    expect(() => parseAIResponse(malformed)).toThrow("parseAIResponse: JSON.parse failed");
  });
});
