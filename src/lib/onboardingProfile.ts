import { ROLES, SKILLS, KEYWORDS_RU, EXCLUDE_KEYWORDS, type CatalogItem } from "@/lib/catalog/data";

export type OnboardingLang = "en" | "ru" | "uk" | "uz";

export interface TrackPreset {
  id: string;
  labels: Record<OnboardingLang, string>;
  subtitles: Record<OnboardingLang, string>;
  roles: string[];
  keywordsEn: string[];
  keywordsRu: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  defaultExcludes: string[];
  triggerTerms: string[];
}

export const TRACK_PRESETS: TrackPreset[] = [
  {
    id: "fullstack",
    labels: {
      en: "Full Stack & Web Engineering",
      ru: "Fullstack и Веб-разработка",
      uk: "Fullstack та Веб-розробка",
      uz: "Fullstack va Veb Dasturlash",
    },
    subtitles: {
      en: "End-to-end web apps, APIs & modern frontend",
      ru: "Веб-приложения под ключ, API и современный фронтенд",
      uk: "Веб-застосунки під ключ, API та сучасний фронтенд",
      uz: "To'liq siklli veb-ilovalar, API va zamonaviy frontend",
    },
    roles: ["Fullstack Developer", "Frontend Developer", "Web Developer", "Software Engineer"],
    keywordsEn: ["full stack developer", "frontend developer", "react developer", "next.js developer", "web developer"],
    keywordsRu: ["фулстек разработчик", "фронтенд разработчик", "веб разработчик", "react разработчик", "nextjs разработчик"],
    requiredSkills: ["React", "TypeScript", "JavaScript", "Next.js", "Node.js"],
    niceToHaveSkills: ["Tailwind CSS", "PostgreSQL", "Prisma", "REST API", "Git", "Docker"],
    defaultExcludes: ["1C", "Bitrix", "Cold calling"],
    triggerTerms: ["fullstack", "full stack", "full-stack", "фулстек", "фуллстек", "веб разработчик", "веб розробник", "veb dasturchi", "sayt", "сайт"],
  },
  {
    id: "frontend",
    labels: {
      en: "Frontend & Interactive UI",
      ru: "Фронтенд и Интерактивный UI",
      uk: "Фронтенд та Інтерактивний UI",
      uz: "Frontend va Interaktiv Interfeyslar",
    },
    subtitles: {
      en: "React, Next.js, TypeScript, Vue & design systems",
      ru: "React, Next.js, TypeScript, Vue и дизайн-системы",
      uk: "React, Next.js, TypeScript, Vue та дизайн-системи",
      uz: "React, Next.js, TypeScript, Vue va dizayn tizimlari",
    },
    roles: ["Frontend Developer", "React Developer", "Next.js Developer", "TypeScript Developer"],
    keywordsEn: ["frontend developer", "react developer", "typescript developer", "next.js developer"],
    keywordsRu: ["фронтенд разработчик", "react разработчик", "верстальщик", "веб разработчик", "javascript разработчик"],
    requiredSkills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    niceToHaveSkills: ["Next.js", "Tailwind CSS", "Redux", "Framer Motion", "Figma"],
    defaultExcludes: ["1C", "PHP", "Cold calling"],
    triggerTerms: ["frontend", "front-end", "фронтенд", "верстальщик", "верстка", "react", "vue", "angular", "next.js", "nextjs"],
  },
  {
    id: "backend",
    labels: {
      en: "Backend & Systems Architecture",
      ru: "Бэкенд и Архитектура Систем",
      uk: "Бекенд та Архітектура Систем",
      uz: "Backend va Tizim Arxitekturasi",
    },
    subtitles: {
      en: "APIs, microservices, databases & high-load services",
      ru: "API, микросервисы, базы данных и высоконагруженные сервисы",
      uk: "API, мікросервіси, бази даних та високонавантажені сервіси",
      uz: "API, mikroservislar, ma'lumotlar bazasi va yuqori yuklamali tizimlar",
    },
    roles: ["Backend Developer", "Software Engineer", "Node.js Developer", "Python Developer", "Go Developer"],
    keywordsEn: ["backend developer", "node.js developer", "python developer", "software engineer", "golang developer"],
    keywordsRu: ["бэкенд разработчик", "backend разработчик", "программист", "python разработчик", "node.js разработчик"],
    requiredSkills: ["Node.js", "Python", "PostgreSQL", "REST API", "SQL"],
    niceToHaveSkills: ["Docker", "Redis", "TypeScript", "Microservices", "Kafka"],
    defaultExcludes: ["Cold calling", "Call center"],
    triggerTerms: ["backend", "back-end", "бэкенд", "бекенд", "node.js", "nodejs", "django", "fastapi", "golang", "spring", "laravel", "микросервисы"],
  },
  {
    id: "design",
    labels: {
      en: "UI/UX & Website Design",
      ru: "UI/UX и Веб-дизайн",
      uk: "UI/UX та Веб-дизайн",
      uz: "UI/UX va Veb-dizayn",
    },
    subtitles: {
      en: "Product design, Figma, Webflow, Framer & Tilda",
      ru: "Продуктовый дизайн, Figma, Webflow, Framer и Tilda",
      uk: "Продуктовий дизайн, Figma, Webflow, Framer та Tilda",
      uz: "Mahsulot dizayni, Figma, Webflow, Framer va Tilda",
    },
    roles: ["UI/UX Designer", "Graphic Designer", "Web Developer", "Motion Designer"],
    keywordsEn: ["ui/ux designer", "product designer", "web designer", "webflow", "framer"],
    keywordsRu: ["ui/ux дизайнер", "веб дизайнер", "продуктовый дизайнер", "тильда", "дизайнер интерфейсов", "дизайнер сайтов"],
    requiredSkills: ["Figma", "UI/UX", "Prototyping", "Web Design"],
    niceToHaveSkills: ["Framer Motion", "Webflow", "Tilda", "HTML", "CSS", "UX Research"],
    defaultExcludes: ["1C", "Cold calling"],
    triggerTerms: ["design", "designer", "ui/ux", "ux/ui", "figma", "дизайн", "дизайнер", "dizayn", "dizayner", "webflow", "tilda", "тильда", "framer"],
  },
  {
    id: "ai",
    labels: {
      en: "AI, Vibe Coding & Automation",
      ru: "AI, Вайб-кодинг и Автоматизация",
      uk: "AI, Вайб-кодинг та Автоматизація",
      uz: "Sun'iy Intellekt va Avtomatlashtirish",
    },
    subtitles: {
      en: "LLMs, AI agents, prompt engineering & rapid shipping",
      ru: "LLM, AI-агенты, промпт-инжиниринг и быстрая разработка",
      uk: "LLM, AI-агенти, промпт-інжиніринг та швидка розробка",
      uz: "LLM, AI agentlar, prompt muhandisligi va tezkor ishlab chiqish",
    },
    roles: ["AI Engineer", "Prompt Engineer", "Fullstack Developer", "Python Developer", "Machine Learning Engineer"],
    keywordsEn: ["ai engineer", "llm engineer", "prompt engineer", "automation engineer", "ai developer"],
    keywordsRu: ["ai разработчик", "инженер ии", "промпт инженер", "автоматизация", "llm разработчик", "нейросети"],
    requiredSkills: ["Python", "TypeScript", "OpenAI API", "LLM", "REST API"],
    niceToHaveSkills: ["Next.js", "React", "LangChain", "RAG", "PostgreSQL"],
    defaultExcludes: ["Cold calling", "1C"],
    triggerTerms: ["ai", "llm", "prompt", "vibe coding", "automation", "ии", "нейросети", "промпт", "автоматизация", "sun'iy intellekt", "avtomatlashtirish", "штучний інтелект"],
  },
  {
    id: "mobile",
    labels: {
      en: "Mobile App Development",
      ru: "Мобильная разработка (iOS / Android)",
      uk: "Мобільна розробка (iOS / Android)",
      uz: "Mobil Ilovalar Dasturlash",
    },
    subtitles: {
      en: "React Native, Flutter, Swift & Kotlin mobile apps",
      ru: "React Native, Flutter, Swift и Kotlin приложения",
      uk: "React Native, Flutter, Swift та Kotlin застосунки",
      uz: "React Native, Flutter, Swift va Kotlin mobil ilovalar",
    },
    roles: ["Mobile Developer", "React Native Developer", "Flutter Developer", "iOS Developer", "Android Developer"],
    keywordsEn: ["mobile developer", "react native developer", "flutter developer", "ios developer", "android developer"],
    keywordsRu: ["мобильный разработчик", "react native разработчик", "flutter разработчик", "ios разработчик", "android разработчик"],
    requiredSkills: ["React Native", "Flutter", "TypeScript", "JavaScript"],
    niceToHaveSkills: ["Swift", "Kotlin", "Firebase", "REST API", "Git"],
    defaultExcludes: ["1C", "Cold calling"],
    triggerTerms: ["mobile", "ios", "android", "flutter", "react native", "мобильный", "мобільний", "mobil"],
  },
  {
    id: "qa",
    labels: {
      en: "QA & Software Testing",
      ru: "QA и Тестирование ПО",
      uk: "QA та Тестування ПЗ",
      uz: "QA va Dasturiy Ta'minotni Sinash",
    },
    subtitles: {
      en: "Manual & automated testing, Playwright, Cypress & API QA",
      ru: "Ручное и автотестирование, Playwright, Cypress и API",
      uk: "Ручне та автотестування, Playwright, Cypress та API",
      uz: "Qo'lda va avtomatlashtirilgan testlash, Playwright, Postman",
    },
    roles: ["QA Engineer", "QA Automation Engineer"],
    keywordsEn: ["qa engineer", "qa automation", "software tester", "sdet", "test engineer"],
    keywordsRu: ["тестировщик по", "инженер по тестированию", "qa инженер", "автотестировщик", "qa automation"],
    requiredSkills: ["Тестирование ПО", "Postman", "SQL", "REST API", "Git"],
    niceToHaveSkills: ["Playwright", "Cypress", "Python", "JavaScript", "Jira"],
    defaultExcludes: ["Cold calling", "Sales"],
    triggerTerms: ["qa", "tester", "testing", "тестировщик", "тестувальник", "sinovchi", "тестирование", "автотесты"],
  },
  {
    id: "devops",
    labels: {
      en: "DevOps, Cloud & SRE",
      ru: "DevOps, Облака и Инфраструктура",
      uk: "DevOps, Хмари та Інфраструктура",
      uz: "DevOps, Bulutli Texnologiyalar va SRE",
    },
    subtitles: {
      en: "Docker, Kubernetes, CI/CD, Linux & cloud infrastructure",
      ru: "Docker, Kubernetes, CI/CD, Linux и облачная инфраструктура",
      uk: "Docker, Kubernetes, CI/CD, Linux та хмарна інфраструктура",
      uz: "Docker, Kubernetes, CI/CD, Linux va bulutli infratuzilma",
    },
    roles: ["DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Systems Administrator"],
    keywordsEn: ["devops engineer", "site reliability engineer", "cloud engineer", "linux administrator"],
    keywordsRu: ["devops инженер", "системный администратор", "облачный инженер", "sre инженер"],
    requiredSkills: ["Docker", "Kubernetes", "Linux", "CI/CD", "Git"],
    niceToHaveSkills: ["Terraform", "Ansible", "AWS", "Nginx", "Prometheus", "Grafana"],
    defaultExcludes: ["Cold calling", "Sales"],
    triggerTerms: ["devops", "sre", "cloud", "kubernetes", "k8s", "docker", "девопс", "сисадмин", "системный администратор", "системний адміністратор", "tizim administratori"],
  },
  {
    id: "data",
    labels: {
      en: "Data Science, BI & Analytics",
      ru: "Аналитика данных, BI и Data Science",
      uk: "Аналітика даних, BI та Data Science",
      uz: "Ma'lumotlar Tahlili, BI va Data Science",
    },
    subtitles: {
      en: "SQL, Python, BI dashboards, product analytics & ML",
      ru: "SQL, Python, BI-дашборды, продуктовая аналитика и ML",
      uk: "SQL, Python, BI-дашборди, продуктова аналітика та ML",
      uz: "SQL, Python, BI panellar, mahsulot tahlili va ML",
    },
    roles: ["Data Analyst", "Data Scientist", "BI Analyst", "Data Engineer"],
    keywordsEn: ["data analyst", "data scientist", "bi analyst", "product analyst", "data engineer"],
    keywordsRu: ["аналитик данных", "data analyst", "дата сайентист", "bi аналитик", "продуктовый аналитик"],
    requiredSkills: ["SQL", "Python", "Excel", "Power BI"],
    niceToHaveSkills: ["Tableau", "Pandas", "ClickHouse", "PostgreSQL", "Machine Learning"],
    defaultExcludes: ["Cold calling", "Sales"],
    triggerTerms: ["data", "analyst", "analytics", "bi", "аналитик", "аналітик", "tahlilchi", "дата", "sql"],
  },
  {
    id: "product",
    labels: {
      en: "Product, Project & Business Analysis",
      ru: "Продакт, Проджект и Бизнес-анализ",
      uk: "Продакт, Проджект та Бізнес-аналіз",
      uz: "Mahsulot, Loyiha va Biznes Tahlil",
    },
    subtitles: {
      en: "Product strategy, Agile/Scrum, roadmaps & system analysis",
      ru: "Управление продуктом, Agile/Scrum, дорожные карты и анализ",
      uk: "Управління продуктом, Agile/Scrum, дорожні карти та аналіз",
      uz: "Mahsulot boshqaruvi, Agile/Scrum va tizimli tahlil",
    },
    roles: ["Product Manager", "Project Manager", "Business Analyst", "System Analyst", "Scrum Master"],
    keywordsEn: ["product manager", "project manager", "business analyst", "system analyst", "scrum master"],
    keywordsRu: ["продакт менеджер", "проектный менеджер", "бизнес аналитик", "системный аналитик", "руководитель проектов"],
    requiredSkills: ["Управление проектами", "Agile", "Scrum", "Jira", "Анализ бизнес-процессов"],
    niceToHaveSkills: ["SQL", "Confluence", "Figma", "Составление ТЗ"],
    defaultExcludes: ["Cold calling", "Call center"],
    triggerTerms: ["product", "project", "manager", "продакт", "проджект", "менеджер", "menejer", "бизнес аналитик", "бізнес аналітик", "biznes tahlilchi"],
  },
];

export interface YearsBracket {
  id: string;
  yearsLabel: Record<OnboardingLang, string>;
  seniorityLabel: Record<OnboardingLang, string>;
  hhExperience: string[];
  autoExcludes: string[];
  numericYears: number;
}

export const YEARS_BRACKETS: YearsBracket[] = [
  {
    id: "0",
    yearsLabel: {
      en: "0 Years / Career Switcher",
      ru: "Без опыта / Старт карьеры",
      uk: "Без досвіду / Старт кар'єри",
      uz: "Tajribasiz / Karyera boshi",
    },
    seniorityLabel: {
      en: "Intern, Trainee & Entry-Level Junior",
      ru: "Стажёр, Trainee и начинающий Junior",
      uk: "Стажер, Trainee та початковий Junior",
      uz: "Amaliyotchi (Intern), Trainee va Junior",
    },
    hhExperience: ["noExperience", "between1And3"],
    autoExcludes: ["Senior", "Team Lead", "Lead", "10+ years", "5+ years"],
    numericYears: 0,
  },
  {
    id: "1",
    yearsLabel: {
      en: "Less than 1 Year",
      ru: "До 1 года опыта",
      uk: "До 1 року досвіду",
      uz: "1 yilgacha tajriba",
    },
    seniorityLabel: {
      en: "Junior & Early-Career Specialist",
      ru: "Junior и младший специалист",
      uk: "Junior та молодший спеціаліст",
      uz: "Junior va kichik mutaxassis",
    },
    hhExperience: ["noExperience", "between1And3"],
    autoExcludes: ["Senior", "Team Lead", "Lead", "10+ years"],
    numericYears: 1,
  },
  {
    id: "1-3",
    yearsLabel: {
      en: "1–3 Years",
      ru: "1–3 года опыта",
      uk: "1–3 роки досвіду",
      uz: "1–3 yil tajriba",
    },
    seniorityLabel: {
      en: "Confident Junior to Mid-Level",
      ru: "Уверенный Junior / Middle",
      uk: "Впевнений Junior / Middle",
      uz: "Mustahkam Junior / Middle",
    },
    hhExperience: ["between1And3", "noExperience"],
    autoExcludes: ["Team Lead", "10+ years"],
    numericYears: 2,
  },
  {
    id: "3-5",
    yearsLabel: {
      en: "3–5 Years",
      ru: "3–5 лет опыта",
      uk: "3–5 років досвіду",
      uz: "3–5 yil tajriba",
    },
    seniorityLabel: {
      en: "Middle+ to Senior Specialist",
      ru: "Middle+ / Senior специалист",
      uk: "Middle+ / Senior спеціаліст",
      uz: "Middle+ / Senior mutaxassis",
    },
    hhExperience: ["between1And3", "between3And6"],
    autoExcludes: ["Internship unpaid"],
    numericYears: 4,
  },
  {
    id: "5-8",
    yearsLabel: {
      en: "5–8 Years",
      ru: "5–8 лет опыта",
      uk: "5–8 років досвіду",
      uz: "5–8 yil tajriba",
    },
    seniorityLabel: {
      en: "Senior, Tech Lead & Architect",
      ru: "Senior, Tech Lead и Архитектор",
      uk: "Senior, Tech Lead та Архітектор",
      uz: "Senior, Tech Lead va Arxitektor",
    },
    hhExperience: ["between3And6", "moreThan6"],
    autoExcludes: ["Internship unpaid"],
    numericYears: 6,
  },
  {
    id: "8+",
    yearsLabel: {
      en: "8+ Years",
      ru: "Более 8 лет опыта",
      uk: "Більше 8 років досвіду",
      uz: "8+ yil tajriba",
    },
    seniorityLabel: {
      en: "Staff, Principal, Team Lead & Head/CTO",
      ru: "Staff, Principal, Team Lead и Руководитель",
      uk: "Staff, Principal, Team Lead та Керівник",
      uz: "Staff, Team Lead va Rahbar / CTO",
    },
    hhExperience: ["moreThan6", "between3And6"],
    autoExcludes: ["Internship unpaid"],
    numericYears: 9,
  },
];

function uniqueStrings(items: string[], max = 35): string[] {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean))).slice(0, max);
}

function matchCatalogItems(text: string, catalog: CatalogItem[]): string[] {
  const lower = text.toLowerCase().replace(/ё/g, "е");
  const matched: string[] = [];
  for (const item of catalog) {
    const candidates = [item.value, ...(item.aliases ?? [])];
    for (const c of candidates) {
      const normC = c.toLowerCase().replace(/ё/g, "е").trim();
      if (normC.length < 2) continue;
      // Match whole word or substring for multi-word terms
      const escaped = normC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex =
        normC.length <= 3
          ? new RegExp(`(^|[^a-zа-яіїєґўқғҳ0-9])${escaped}($|[^a-zа-яіїєґўқғҳ0-9])`, "i")
          : new RegExp(escaped, "i");
      if (regex.test(lower)) {
        matched.push(item.value);
        break;
      }
    }
  }
  return uniqueStrings(matched);
}

/**
 * Parses free-text answers in ANY language (English, Russian, Ukrainian, Uzbek, Kazakh, etc.)
 * and extracts matching specialization tracks, roles, skills, EN/RU search keywords,
 * experience bracket, and work formats.
 */
export function parseMultilingualOnboardingText(rawText: string): {
  matchedTrackIds: string[];
  roles: string[];
  skills: string[];
  keywordsRu: string[];
  detectedYearsBracketId: string | null;
  detectedWorkFormats: string[];
} {
  const text = rawText.trim();
  if (!text) {
    return {
      matchedTrackIds: [],
      roles: [],
      skills: [],
      keywordsRu: [],
      detectedYearsBracketId: null,
      detectedWorkFormats: [],
    };
  }

  const lower = text.toLowerCase().replace(/ё/g, "е");

  // 1. Detect specialization tracks
  const matchedTrackIds: string[] = [];
  for (const track of TRACK_PRESETS) {
    if (track.triggerTerms.some((term) => lower.includes(term.toLowerCase()))) {
      matchedTrackIds.push(track.id);
    }
  }

  // 2. Match roles, skills, and RU keywords across multilingual aliases
  const roles = matchCatalogItems(text, ROLES);
  const skills = matchCatalogItems(text, SKILLS);
  const keywordsRu = matchCatalogItems(text, KEYWORDS_RU);

  // 3. Detect years of experience in EN / RU / UK / UZ / KK
  let detectedYearsBracketId: string | null = null;
  if (
    /(no experience|without experience|intern|trainee|student|без опыта|стажер|стажёр|начинающий|без досвіду|початківець|tajribasiz|boshlang'ich|amaliyotchi)/i.test(
      lower
    )
  ) {
    detectedYearsBracketId = "0";
  } else {
    const yearsMatch = lower.match(
      /(\d+)\s*(\+|плюс)?\s*(years?|yrs?|год|года|лет|рік|роки|років|yil|жыл)/i
    );
    if (yearsMatch) {
      const yrs = parseInt(yearsMatch[1], 10);
      if (yrs === 0) detectedYearsBracketId = "0";
      else if (yrs === 1) detectedYearsBracketId = "1-3";
      else if (yrs <= 3) detectedYearsBracketId = "1-3";
      else if (yrs <= 5) detectedYearsBracketId = "3-5";
      else if (yrs <= 8) detectedYearsBracketId = "5-8";
      else detectedYearsBracketId = "8+";
    }
  }

  // 4. Detect work format in EN / RU / UK / UZ
  const detectedWorkFormats: string[] = [];
  if (/(remote|удаленно|удалённо|дистанционно|віддалено|дистанційно|masofaviy|uydan)/i.test(lower)) {
    detectedWorkFormats.push("remote");
  }
  if (/(hybrid|гибрид|гібрид|gibrid)/i.test(lower)) {
    detectedWorkFormats.push("hybrid");
  }
  if (/(office|on-site|onsite|в офисе|офис|офіс|ofis)/i.test(lower)) {
    detectedWorkFormats.push("office");
  }

  return {
    matchedTrackIds: uniqueStrings(matchedTrackIds),
    roles,
    skills,
    keywordsRu,
    detectedYearsBracketId,
    detectedWorkFormats: uniqueStrings(detectedWorkFormats),
  };
}

/**
 * Given any list of roles or keywords (in EN, RU, UK, UZ, etc.), automatically derives
 * both English and Russian search queries for HeadHunter so the user never misses matches.
 */
export function expandBilingualKeywords(params: {
  selectedTrackIds: string[];
  targetRoles: string[];
  customKeywordsEn?: string[];
  customKeywordsRu?: string[];
  freeTextBio?: string;
}): { searchKeywordsEn: string[]; searchKeywordsRu: string[] } {
  const activePresets = TRACK_PRESETS.filter((p) => params.selectedTrackIds.includes(p.id));
  const parsedBio = parseMultilingualOnboardingText(
    [params.freeTextBio ?? "", ...params.targetRoles].join(" ")
  );

  // Map any recognized role back to corresponding Russian keywords via shared aliases/stems
  const roleDerivedRu: string[] = [];
  for (const role of params.targetRoles) {
    const matchedRu = matchCatalogItems(role, KEYWORDS_RU);
    roleDerivedRu.push(...matchedRu);
  }

  const searchKeywordsEn = uniqueStrings([
    ...(params.customKeywordsEn ?? []),
    ...activePresets.flatMap((p) => p.keywordsEn),
    ...params.targetRoles.map((r) => r.toLowerCase()),
    ...parsedBio.roles.map((r) => r.toLowerCase()),
  ]);

  const searchKeywordsRu = uniqueStrings([
    ...(params.customKeywordsRu ?? []),
    ...activePresets.flatMap((p) => p.keywordsRu),
    ...roleDerivedRu,
    ...parsedBio.keywordsRu,
  ]);

  return { searchKeywordsEn, searchKeywordsRu };
}

/**
 * Synthesizes a complete, structured candidate profile summary (`resumeText`) from all
 * questionnaire answers so AI vacancy scoring and cover letter generation work out of the box.
 */
export function synthesizeCandidateResume(params: {
  name?: string;
  selectedTrackIds: string[];
  yearsBracketId: string;
  exactYears?: string;
  targetRoles: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  workFormat: string[];
  salaryMinimum?: string | number | null;
  salaryCurrency?: string;
  portfolioUrl?: string;
  userNotes?: string;
}): string {
  const activeTracks = TRACK_PRESETS.filter((p) => params.selectedTrackIds.includes(p.id));
  const bracket = YEARS_BRACKETS.find((b) => b.id === params.yearsBracketId) ?? YEARS_BRACKETS[2];
  const yearsText = params.exactYears?.trim()
    ? `${params.exactYears.trim()} years of experience (${bracket.seniorityLabel.en})`
    : `${bracket.yearsLabel.en} (${bracket.seniorityLabel.en})`;

  const lines: string[] = [];
  if (params.name?.trim()) {
    lines.push(`Candidate: ${params.name.trim()}`);
  }
  if (activeTracks.length > 0) {
    lines.push(`Specialization: ${activeTracks.map((t) => t.labels.en).join(", ")}`);
  }
  lines.push(`Experience Level: ${yearsText}`);

  if (params.targetRoles.length > 0) {
    lines.push(`Target Roles: ${params.targetRoles.join(", ")}`);
  }
  if (params.requiredSkills.length > 0) {
    lines.push(`Core Tech Stack & Skills: ${params.requiredSkills.join(", ")}`);
  }
  if (params.niceToHaveSkills.length > 0) {
    lines.push(`Additional / Bonus Skills: ${params.niceToHaveSkills.join(", ")}`);
  }
  if (params.workFormat.length > 0) {
    lines.push(`Preferred Work Format: ${params.workFormat.join(", ")}`);
  }
  if (params.salaryMinimum) {
    lines.push(`Target Compensation: from ${params.salaryMinimum} ${params.salaryCurrency || "RUR"}`);
  }
  if (params.portfolioUrl?.trim()) {
    lines.push(`Portfolio / Links: ${params.portfolioUrl.trim()}`);
  }
  if (params.userNotes?.trim()) {
    lines.push(`\nBackground, Projects & Career Goals:\n${params.userNotes.trim()}`);
  }

  return lines.join("\n");
}

