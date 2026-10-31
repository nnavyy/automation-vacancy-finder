import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ page: vi.fn(), ai: vi.fn() }));
vi.mock("@/lib/publicFetch", () => ({ fetchPublicPage: mocks.page }));
vi.mock("@/lib/aiProviderRouter", () => ({ callAI: mocks.ai }));
import { crawlDeepCompanyIntel, findContactsDDG } from "@/lib/companyIntel";

beforeEach(() => {
  vi.stubEnv("HUNTER_API_KEY", ""); vi.stubEnv("APOLLO_API_KEY", "");
  mocks.page.mockReset();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("<html></html>")));
});

it("follows a company's actual recruiting link and does not call public emails verified", async () => {
  mocks.page.mockImplementation(async (url: string) => new Response(url === "https://acme-example.com"
    ? '<a href="/ru/vacancies">Работа у нас</a>'
    : url === "https://acme-example.com/ru/vacancies"
      ? '<article><h3>Jane Doe</h3><p>HR Manager</p><a href="mailto:recruiting@acme-example.com">Email</a><a href="https://www.linkedin.com/in/jane-doe">LinkedIn</a></article><p>Support: support@vendor-example.com</p>'
      : "", { status: url === "https://acme-example.com" || url.endsWith("/ru/vacancies") ? 200 : 404 }));
  const result = await crawlDeepCompanyIntel("Acme", "acme-example.com");
  expect(mocks.page).toHaveBeenCalledWith("https://acme-example.com/ru/vacancies", expect.any(Number));
  const person = result.contacts.find(c => c.name === "Jane Doe");
  expect(person).toMatchObject({ role: "HR Manager", email: "recruiting@acme-example.com", emailVerified: false });
  expect(result.contacts.some(c => c.email === "support@vendor-example.com")).toBe(false);
  expect(result.metadata.crawledSources?.some(s => s.link === "https://acme-example.com/ru/vacancies")).toBe(true);
});

it("only accepts relevant hiring profiles associated with the requested company", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(`<ol>
    <li class="b_algo"><h2><a href="https://www.linkedin.com/in/jane-doe">Jane Doe - Recruiter at Acme | LinkedIn</a></h2><p>Talent acquisition at Acme</p></li>
    <li class="b_algo"><h2><a href="https://www.linkedin.com/in/other-person">Other Person - Recruiter at Different Co | LinkedIn</a></h2><p>Recruiting</p></li>
    <li class="b_algo"><h2><a href="https://linkedin.com.evil.test/in/fake">Fake - HR at Acme</a></h2><p>Acme HR</p></li>
    <li class="b_algo"><h2><a href="https://www.linkedin.com/in/former">Former Person - Previously recruiter at Acme</a></h2><p>Former Acme recruiter</p></li>
    </ol>`)));
  const result = await findContactsDDG("Acme", "acme-example.com");
  expect(result.map(c => c.name)).toEqual(["Jane Doe"]);
});

