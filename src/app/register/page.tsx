"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Briefcase,
  Sparkles,
  Sliders,
  Clock,
  Code2,
  FileText,
  Globe,
  Link2,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import TagInput from "@/components/ui/TagInput";
import {
  ROLES,
  SKILLS,
  KEYWORDS_RU,
  EXCLUDE_KEYWORDS,
} from "@/lib/catalog/data";
import {
  TRACK_PRESETS,
  YEARS_BRACKETS,
  type OnboardingLang,
  parseMultilingualOnboardingText,
  expandBilingualKeywords,
  synthesizeCandidateResume,
} from "@/lib/onboardingProfile";

const UI_COPY: Record<
  OnboardingLang,
  {
    stepCounter: (q: number) => string;
    accountReady: string;
    verifyEmail: string;
    langHint: string;
    q1Title: string;
    q1Sub: string;
    q1CustomLabel: string;
    q1CustomPlaceholder: string;
    q2Title: string;
    q2Sub: string;
    q2BracketLabel: string;
    q2ExactYearsLabel: string;
    q2ExactYearsPlaceholder: string;
    q2HhTiersLabel: string;
    q3Title: string;
    q3Sub: string;
    q3RolesLabel: string;
    q3KeywordsEnLabel: string;
    q3KeywordsRuLabel: string;
    q4Title: string;
    q4Sub: string;
    q4CoreSkillsLabel: string;
    q4BonusSkillsLabel: string;
    q5Title: string;
    q5Sub: string;
    q5WorkFormatLabel: string;
    q5SalaryLabel: string;
    q5ExcludeLabel: string;
    q5CoverLetterLangLabel: string;
    q5MatchScoreLabel: string;
    q6Title: string;
    q6Sub: string;
    q6NotesLabel: string;
    q6NotesPlaceholder: string;
    q6PortfolioLabel: string;
    q6ProfileNameLabel: string;
    backBtn: string;
    nextBtn: string;
    finishBtn: string;
    skipToAccountBtn: string;
    editProfileBtn: string;
  }
> = {
  en: {
    stepCounter: (q) => `Question ${q} of 6 — Automatic Profile Builder`,
    accountReady: "Your profile is ready — create your account to launch",
    verifyEmail: "Verify your email address to activate your account",
    langHint: "Answer in any language (EN, RU, UA, UZ, KZ) — we auto-translate & map your profile.",
    q1Title: "1. What do you do, and what field do you want to work in?",
    q1Sub: "Pick one or more tracks, or type what you do in your own words below.",
    q1CustomLabel: "DESCRIBE WHAT YOU DO IN ANY LANGUAGE (OPTIONAL — AUTO-DETECTS ROLES & SKILLS)",
    q1CustomPlaceholder:
      "e.g. I build full-stack web apps with React & Node.js / Я фронтенд-разработчик / Men veb dasturchiman / Я тестувальник ПЗ...",
    q2Title: "2. How many years of experience do you have?",
    q2Sub: "We calibrate your seniority filters and automatically block mismatched senior/lead roles.",
    q2BracketLabel: "SELECT YOUR EXPERIENCE BRACKET",
    q2ExactYearsLabel: "EXACT YEARS OF EXPERIENCE (OPTIONAL)",
    q2ExactYearsPlaceholder: "e.g. 2 or 3.5",
    q2HhTiersLabel: "TARGET HEADHUNTER EXPERIENCE TIERS",
    q3Title: "3. Which roles and search keywords should we hunt for?",
    q3Sub: "Pre-filled in both English and Russian/CIS so you never miss matching vacancies.",
    q3RolesLabel: "TARGET ROLES (TYPE IN ANY LANGUAGE)",
    q3KeywordsEnLabel: "SEARCH KEYWORDS (ENGLISH)",
    q3KeywordsRuLabel: "SEARCH KEYWORDS (RUSSIAN / CIS)",
    q4Title: "4. What is your core tech stack and bonus skills?",
    q4Sub: "Our AI scorer compares every job description against these skills.",
    q4CoreSkillsLabel: "CORE / MUST-HAVE SKILLS",
    q4BonusSkillsLabel: "BONUS / NICE-TO-HAVE SKILLS",
    q5Title: "5. How do you prefer to work, and what should we filter out?",
    q5Sub: "Set your work schedule, minimum salary, excluded keywords, and AI match strictness.",
    q5WorkFormatLabel: "PREFERRED WORK SCHEDULE",
    q5SalaryLabel: "MINIMUM SALARY (OPTIONAL)",
    q5ExcludeLabel: "KEYWORDS / ROLES TO EXCLUDE FROM FEED",
    q5CoverLetterLangLabel: "AI COVER LETTER LANGUAGE",
    q5MatchScoreLabel: "MINIMUM AI MATCH SCORE TO NOTIFY",
    q6Title: "6. What do you want to build, and where can recruiters see your work?",
    q6Sub: "Everything is combined into your AI resume dossier (you can edit or add more in Settings anytime).",
    q6NotesLabel: "WHAT DO YOU WANT TO WORK ON? (PROJECTS, ACHIEVEMENTS OR GOALS — ANY LANGUAGE)",
    q6NotesPlaceholder:
      "Write in English, Russian, Ukrainian, Uzbek, etc. Describe your key projects, background, or the type of company and product you want to work for...",
    q6PortfolioLabel: "PORTFOLIO / GITHUB / LINKEDIN URL (OPTIONAL)",
    q6ProfileNameLabel: "PROFILE NAME",
    backBtn: "Back",
    nextBtn: "Next Question",
    finishBtn: "Continue to Account Setup",
    skipToAccountBtn: "Use auto-filled defaults ->",
    editProfileBtn: "Edit Answers",
  },
  ru: {
    stepCounter: (q) => `Вопрос ${q} из 6 — Автонастройка профиля`,
    accountReady: "Профиль полностью готов — создайте аккаунт для запуска",
    verifyEmail: "Подтвердите email кодом для активации аккаунта",
    langHint: "Отвечайте на любом языке (RU, EN, UA, UZ, KZ) — система сама заполнит профиль.",
    q1Title: "1. Чем вы занимаетесь и в какой сфере хотите работать?",
    q1Sub: "Выберите одно или несколько направлений или напишите своими словами ниже.",
    q1CustomLabel: "ОПИШИТЕ СВОЙ ПРОФИЛЬ СВОИМИ СЛОВАМИ (ЛЮБОЙ ЯЗЫК — АВТООПРЕДЕЛЕНИЕ НАВЫКОВ)",
    q1CustomPlaceholder:
      "Напр.: Делаю сайты на React и Next.js, 2 года опыта / Веб-дизайнер в Figma / Python разработчик...",
    q2Title: "2. Сколько у вас лет опыта работы?",
    q2Sub: "Мы настроим фильтр грейда и автоматически скроем неподходящие Senior/Lead вакансии.",
    q2BracketLabel: "ВЫБЕРИТЕ ВАШ ОПЫТ РАБОТЫ",
    q2ExactYearsLabel: "ТОЧНОЕ КОЛИЧЕСТВО ЛЕТ ОПЫТА (ОПЦИОНАЛЬНО)",
    q2ExactYearsPlaceholder: "Напр.: 1.5 или 3",
    q2HhTiersLabel: "КАТЕГОРИИ ОПЫТА НА HEADHUNTER",
    q3Title: "3. Какие должности и ключевые слова искать?",
    q3Sub: "Заполнено автоматически на русском и английском для максимального охвата вакансий.",
    q3RolesLabel: "ЦЕЛЕВЫЕ ДОЛЖНОСТИ (НА ЛЮБОМ ЯЗЫКЕ)",
    q3KeywordsEnLabel: "ПОИСКОВЫЕ ЗАПРОСЫ (АНГЛИЙСКИЙ)",
    q3KeywordsRuLabel: "ПОИСКОВЫЕ ЗАПРОСЫ (РУССКИЙ / СНГ)",
    q4Title: "4. Ваш основной стек технологий и дополнительные навыки?",
    q4Sub: "ИИ-анализатор сверяет каждое требование вакансии с этим списком.",
    q4CoreSkillsLabel: "ОСНОВНЫЕ НАВЫКИ (СТЕК)",
    q4BonusSkillsLabel: "ДОПОЛНИТЕЛЬНЫЕ НАВЫКИ (БУДЕТ ПЛЮСОМ)",
    q5Title: "5. Формат работы, зарплата и стоп-слова",
    q5Sub: "Укажите формат работы, желаемую зарплату и ключевые слова для исключения.",
    q5WorkFormatLabel: "ФОРМАТ РАБОТЫ",
    q5SalaryLabel: "МИНИМАЛЬНАЯ ЗАРПЛАТА (ОПЦИОНАЛЬНО)",
    q5ExcludeLabel: "ИСКЛЮЧИТЬ ВАКАНСИИ СО СЛОВАМИ",
    q5CoverLetterLangLabel: "ЯЗЫК СОПРОВОДИТЕЛЬНЫХ ПИСЕМ",
    q5MatchScoreLabel: "МИНИМАЛЬНЫЙ ПОРОГ СОВПАДЕНИЯ ИИ",
    q6Title: "6. Над чем вы хотите работать и ссылка на портфолио",
    q6Sub: "Эти данные сформируют ваше резюме для ИИ (вы всегда сможете дополнить их в Настройках).",
    q6NotesLabel: "О ВАШЕМ ОПЫТЕ, ПРОЕКТАХ И ЦЕЛЯХ (НА ЛЮБОМ ЯЗЫКЕ)",
    q6NotesPlaceholder:
      "Опишите ключевые проекты, достижения и в какой компании или продукте вы хотите развиваться...",
    q6PortfolioLabel: "ССЫЛКА НА ПОРТФОЛИО / GITHUB / LINKEDIN (ОПЦИОНАЛЬНО)",
    q6ProfileNameLabel: "НАЗВАНИЕ ПРОФИЛЯ",
    backBtn: "Назад",
    nextBtn: "Следующий вопрос",
    finishBtn: "Перейти к созданию аккаунта",
    skipToAccountBtn: "Использовать автонастройки ->",
    editProfileBtn: "Изменить ответы",
  },
  uk: {
    stepCounter: (q) => `Питання ${q} з 6 — Автоналаштування профілю`,
    accountReady: "Профіль готовий — створіть акаунт для запуску",
    verifyEmail: "Підтвердіть email кодом для активації акаунта",
    langHint: "Відповідайте будь-якою мовою (UA, EN, RU, UZ) — ми автоматично налаштуємо профіль.",
    q1Title: "1. Чим ви займаєтесь та в якій сфері хочете працювати?",
    q1Sub: "Оберіть один або декілька напрямків або напишіть своїми словами нижче.",
    q1CustomLabel: "ОПИШІТЬ СВІЙ ПРОФІЛЬ СВОЇМИ СЛОВАМИ (БУДЬ-ЯКА МОВА — АВТОВИЗНАЧЕННЯ НАВИЧОК)",
    q1CustomPlaceholder:
      "Напр.: Я фронтенд розробник на React та Next.js, 2 роки досвіду / Дизайнер інтерфейсів у Figma...",
    q2Title: "2. Скільки у вас років досвіду роботи?",
    q2Sub: "Ми налаштуємо рівень позицій та автоматично приберемо невідповідні Senior/Lead вакансії.",
    q2BracketLabel: "ОБЕРІТЬ ВАШ ДОСВІД РОБОТИ",
    q2ExactYearsLabel: "ТОЧНА КІЛЬКІСТЬ РОКІВ ДОСВІДУ (ОПЦІОНАЛЬНО)",
    q2ExactYearsPlaceholder: "Напр.: 2 або 3.5",
    q2HhTiersLabel: "КАТЕГОРІЇ ДОСВІДУ HEADHUNTER",
    q3Title: "3. Які посади та ключові слова шукати?",
    q3Sub: "Автоматично заповнено для максимального охоплення релевантних вакансій.",
    q3RolesLabel: "ЦІЛЬОВІ ПОСАДИ (БУДЬ-ЯКОЮ МОВОЮ)",
    q3KeywordsEnLabel: "ПОШУКОВІ ЗАПИТИ (АНГЛІЙСЬКА)",
    q3KeywordsRuLabel: "ПОШУКОВІ ЗАПИТИ (РЕГІОНАЛЬНІ)",
    q4Title: "4. Ваш основний стек технологій та бонусні навички?",
    q4Sub: "ШІ-сканер порівнює кожну вакансію з вашими ключовими навичками.",
    q4CoreSkillsLabel: "ОСНОВНІ НАВИЧКИ (СТЕК)",
    q4BonusSkillsLabel: "ДОДАТКОВІ НАВИЧКИ",
    q5Title: "5. Формат роботи, зарплата та стоп-слова",
    q5Sub: "Вкажіть бажаний графік, мінімальну зарплату та слова-виключення.",
    q5WorkFormatLabel: "ФОРМАТ РОБОТИ",
    q5SalaryLabel: "МІНІМАЛЬНА ЗАРПЛАТА (ОПЦІОНАЛЬНО)",
    q5ExcludeLabel: "ВИКЛЮЧИТИ ВАКАНСІЇ ЗІ СЛОВАМИ",
    q5CoverLetterLangLabel: "МОВА СУПРОВІДНИХ ЛИСТІВ",
    q5MatchScoreLabel: "МІНІМАЛЬНИЙ ПОРІГ ЗБІГУ ШІ",
    q6Title: "6. Над чим ви хочете працювати та посилання на портфоліо",
    q6Sub: "Ці дані сформують ваше резюме для ШІ (ви завжди зможете доповнити їх у Налаштуваннях).",
    q6NotesLabel: "ПРО ВАШ ДОСВІД, ПРОЄКТИ ТА ЦІЛІ (БУДЬ-ЯКОЮ МОВОЮ)",
    q6NotesPlaceholder:
      "Опишіть ваші проєкти, досягнення та в якій компанії чи продукті ви хочете працювати...",
    q6PortfolioLabel: "ПОРТФОЛІО / GITHUB / LINKEDIN URL (ОПЦІОНАЛЬНО)",
    q6ProfileNameLabel: "НАЗВА ПРОФІЛЮ",
    backBtn: "Назад",
    nextBtn: "Наступне питання",
    finishBtn: "Перейти до створення акаунта",
    skipToAccountBtn: "Використати автоналаштування ->",
    editProfileBtn: "Змінити відповіді",
  },
  uz: {
    stepCounter: (q) => `Savol ${q} / 6 — Avtomatik profil sozlash`,
    accountReady: "Profilingiz tayyor — ishga tushirish uchun hisob yarating",
    verifyEmail: "Hisobingizni faollashtirish uchun email кодини kiriting",
    langHint: "Istalgan tilda javob bering (UZ, RU, EN, UA) — tizim profilni avtomatik to'ldiradi.",
    q1Title: "1. Nima ish qilasiz va qaysi sohada ishlashni xohlaysiz?",
    q1Sub: "Bir yoki bir nechta yo'nalishni tanlang yoki pastda o'z so'zingiz bilan yozing.",
    q1CustomLabel: "FAOLIYATINGIZNI ISTALGAN TILDA YOZING (IXTIYORIY — AVTO-ANIQLASH)",
    q1CustomPlaceholder:
      "Masalan: Men React va Node.js bo'yicha veb dasturchiman, 2 yil tajribam bor / UI/UX dizaynerman...",
    q2Title: "2. Necha yillik ish tajribangiz bor?",
    q2Sub: "Biz darajangizga mos filtrlarni o'rnatamiz va mos kelmaydigan Senior/Lead vakansiyalarni yashiramiz.",
    q2BracketLabel: "TAJRIBA DARAJANGIZNI TANLANG",
    q2ExactYearsLabel: "ANIQ TAJRIBA YILLARI (IXTIYORIY)",
    q2ExactYearsPlaceholder: "Masalan: 2 yoki 3.5",
    q2HhTiersLabel: "HEADHUNTER TAJRIBA TOIFALARI",
    q3Title: "3. Qanday lavozim va kalit so'zlarni qidiraylik?",
    q3Sub: "Barcha mos vakansiyalarni topish uchun ingliz va rus/MDH tillarida avtomatik to'ldirildi.",
    q3RolesLabel: "MAQSADLI LAVOZIMLAR (ISTALGAN TILDA)",
    q3KeywordsEnLabel: "QIDIRUV KALIT SO'ZLARI (INGLIZCHA)",
    q3KeywordsRuLabel: "QIDIRUV KALIT SO'ZLARI (RUSCHA / MDH)",
    q4Title: "4. Asosiy texnologiyalaringiz va qo'shimcha ko'nikmalaringiz?",
    q4Sub: "AI har bir vakansiyani ushbu ko'nikmalar ro'yxati bilan solishtiradi.",
    q4CoreSkillsLabel: "ASOSIY KO'NIKMALAR (TEXNOLOGIYALAR)",
    q4BonusSkillsLabel: "QO'SHIMCHA / BONUS KO'NIKMALAR",
    q5Title: "5. Ish formati, maosh va istisno filtrlari",
    q5Sub: "Ish grafigi, minimal maosh va keraksiz vakansiyalarni cheklash so'zlarini belgilang.",
    q5WorkFormatLabel: "MA'QUL ISH FORMATI",
    q5SalaryLabel: "MINIMAL MAOSH (IXTIYORIY)",
    q5ExcludeLabel: "USHBU SO'ZLAR BOR VAKANSIYALARNI CHETLATISH",
    q5CoverLetterLangLabel: "AI XAT (COVER LETTER) TILI",
    q5MatchScoreLabel: "MINIMAL AI MOSLIK DARAJASI",
    q6Title: "6. Nimalar ustida ishlashni xohlaysiz va portfolio havolasi",
    q6Sub: "Barcha javoblaringiz AI rezyumesiga birlashtiriladi (Sozlamalarda istalgan vaqtda qo'shishingiz mumkin).",
    q6NotesLabel: "LOYIHALARINGIZ, TAJRIBANGIZ VA MAQSADINGIZ HAQIDA (ISTALGAN TILDA)",
    q6NotesPlaceholder:
      "O'zbek, rus yoki ingliz tilida yozing: qilgan loyihalaringiz va qanday kompaniyada ishlashni xohlashingiz...",
    q6PortfolioLabel: "PORTFOLIO / GITHUB / LINKEDIN HAVOLASI (IXTIYORIY)",
    q6ProfileNameLabel: "PROFIL NOMI",
    backBtn: "Orqaga",
    nextBtn: "Keyingi savol",
    finishBtn: "Hisob yaratishga o'tish",
    skipToAccountBtn: "Avto-sozlamalar bilan davom etish ->",
    editProfileBtn: "Javoblarni tahrirlash",
  },
};

const HH_EXPERIENCE_TIERS: Array<{
  value: string;
  labels: Record<OnboardingLang, string>;
}> = [
  {
    value: "noExperience",
    labels: {
      en: "No Experience (Intern / Trainee)",
      ru: "Без опыта (Стажёр / Junior)",
      uk: "Без досвіду (Стажер / Junior)",
      uz: "Tajribasiz (Intern / Junior)",
    },
  },
  {
    value: "between1And3",
    labels: {
      en: "1–3 Years (Junior / Middle)",
      ru: "От 1 года до 3 лет",
      uk: "Від 1 до 3 років",
      uz: "1 yildan 3 yilgacha",
    },
  },
  {
    value: "between3And6",
    labels: {
      en: "3–6 Years (Middle / Senior)",
      ru: "От 3 до 6 лет",
      uk: "Від 3 до 6 років",
      uz: "3 yildan 6 yilgacha",
    },
  },
  {
    value: "moreThan6",
    labels: {
      en: "6+ Years (Senior / Lead)",
      ru: "Более 6 лет",
      uk: "Більше 6 років",
      uz: "6 yildan ortiq",
    },
  },
];

const WORK_FORMATS: Array<{
  value: string;
  labels: Record<OnboardingLang, string>;
}> = [
  {
    value: "remote",
    labels: { en: "Remote", ru: "Удалённо", uk: "Віддалено", uz: "Masofaviy (Remote)" },
  },
  {
    value: "hybrid",
    labels: { en: "Hybrid", ru: "Гибрид", uk: "Гібрид", uz: "Gibrid" },
  },
  {
    value: "office",
    labels: { en: "On-site / Office", ru: "В офисе", uk: "В офісі", uz: "Ofisda" },
  },
];

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

export default function RegisterPage() {
  const router = useRouter();

  // Language for the onboarding questions UI (while answers work in ANY language)
  const [uiLang, setUiLang] = useState<OnboardingLang>("en");
  const copy = UI_COPY[uiLang];

  // Overall wizard step: "questions" (6-question profile setup) -> "account" (credentials) -> "otp" (email verification)
  const [step, setStep] = useState<"questions" | "account" | "otp">("questions");
  const [questionTab, setQuestionTab] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Question 1: Specializations & Free-text description in any language
  const [selectedTracks, setSelectedTracks] = useState<string[]>(["fullstack"]);
  const [customWhatIDoText, setCustomWhatIDoText] = useState<string>("");

  // Question 2: Years of experience & HH tiers
  const [yearsBracketId, setYearsBracketId] = useState<string>("1-3");
  const [exactYears, setExactYears] = useState<string>("2");
  const [experience, setExperience] = useState<string[]>(["between1And3", "noExperience"]);

  // Question 3: Target Roles & Bilingual Keywords (EN + RU/CIS)
  const [targetRoles, setTargetRoles] = useState<string[]>(TRACK_PRESETS[0].roles);
  const [searchKeywordsEn, setSearchKeywordsEn] = useState<string[]>(TRACK_PRESETS[0].keywordsEn);
  const [searchKeywordsRu, setSearchKeywordsRu] = useState<string[]>(TRACK_PRESETS[0].keywordsRu);

  // Question 4: Core & Bonus Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>(TRACK_PRESETS[0].requiredSkills);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>(TRACK_PRESETS[0].niceToHaveSkills);

  // Question 5: Work Format, Salary, Exclude Keywords, AI Match Strictness & Cover Letter Language
  const [workFormat, setWorkFormat] = useState<string[]>(["remote", "hybrid"]);
  const [salaryMinimum, setSalaryMinimum] = useState<string>("");
  const [salaryCurrency, setSalaryCurrency] = useState<string>("RUR");
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([
    ...TRACK_PRESETS[0].defaultExcludes,
    ...YEARS_BRACKETS[2].autoExcludes,
  ]);
  const [coverLetterLanguage, setCoverLetterLanguage] = useState<string>("Auto (Match Vacancy Language)");
  const [minimumScoreToNotify, setMinimumScoreToNotify] = useState<number>(70);

  // Question 6: Bio/Goals (any language), Portfolio URL & Profile Name
  const [userNotes, setUserNotes] = useState<string>("");
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("Full Stack & Web");

  // Step 2: Account Credentials State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: OTP State
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Synchronize roles, skills, keywords, and excludes when tracks or multilingual free-text change
  const syncFromTracksAndText = (nextTracks: string[], freeText: string, currentBracketId: string) => {
    const parsed = parseMultilingualOnboardingText(freeText);
    const mergedTrackIds = uniqueStrings([...nextTracks, ...parsed.matchedTrackIds]);
    const activePresets = TRACK_PRESETS.filter((p) => mergedTrackIds.includes(p.id));
    const bracket = YEARS_BRACKETS.find((b) => b.id === currentBracketId) ?? YEARS_BRACKETS[2];

    if (activePresets.length > 0 || parsed.roles.length > 0) {
      const nextRoles = uniqueStrings([
        ...activePresets.flatMap((p) => p.roles),
        ...parsed.roles,
      ]);
      setTargetRoles(nextRoles);

      const { searchKeywordsEn: kwEn, searchKeywordsRu: kwRu } = expandBilingualKeywords({
        selectedTrackIds: mergedTrackIds,
        targetRoles: nextRoles,
        freeTextBio: freeText,
      });
      setSearchKeywordsEn(kwEn);
      setSearchKeywordsRu(kwRu);

      setRequiredSkills(
        uniqueStrings([
          ...activePresets.flatMap((p) => p.requiredSkills),
          ...parsed.skills,
        ])
      );
      setNiceToHaveSkills(uniqueStrings(activePresets.flatMap((p) => p.niceToHaveSkills)));
      setExcludeKeywords(
        uniqueStrings([
          ...activePresets.flatMap((p) => p.defaultExcludes),
          ...bracket.autoExcludes,
        ])
      );

      if (activePresets.length > 0) {
        const primary = activePresets[0].labels.en.split("&")[0].trim();
        setProfileName(
          activePresets.length === 1 ? primary : `${primary} + ${activePresets.length - 1}`
        );
      }
    }

    if (parsed.detectedYearsBracketId) {
      const matchedBracket = YEARS_BRACKETS.find((b) => b.id === parsed.detectedYearsBracketId);
      if (matchedBracket) {
        setYearsBracketId(matchedBracket.id);
        setExperience(matchedBracket.hhExperience);
      }
    }

    if (parsed.detectedWorkFormats.length > 0) {
      setWorkFormat(parsed.detectedWorkFormats);
    }
  };

  const handleToggleTrack = (trackId: string) => {
    setSelectedTracks((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      syncFromTracksAndText(next, customWhatIDoText, yearsBracketId);
      return next;
    });
  };

  const handleCustomTextChange = (val: string) => {
    setCustomWhatIDoText(val);
    if (val.trim().length >= 3) {
      const parsed = parseMultilingualOnboardingText(val);
      const mergedTracks =
        parsed.matchedTrackIds.length > 0
          ? uniqueStrings([...selectedTracks, ...parsed.matchedTrackIds])
          : selectedTracks;
      if (parsed.matchedTrackIds.length > 0) {
        setSelectedTracks(mergedTracks);
      }
      syncFromTracksAndText(mergedTracks, val, yearsBracketId);
    }
  };

  const handleSelectYearsBracket = (bracketId: string) => {
    setYearsBracketId(bracketId);
    const bracket = YEARS_BRACKETS.find((b) => b.id === bracketId);
    if (bracket) {
      setExperience(bracket.hhExperience);
      setExactYears(String(bracket.numericYears));
      const activePresets = TRACK_PRESETS.filter((p) => selectedTracks.includes(p.id));
      setExcludeKeywords(
        uniqueStrings([
          ...activePresets.flatMap((p) => p.defaultExcludes),
          ...bracket.autoExcludes,
        ])
      );
    }
  };

  const toggleMultiChoice = (
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    setter(current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
  };

  const handleNextQuestion = () => {
    setError(null);
    if (questionTab === 1) {
      if (selectedTracks.length === 0 && targetRoles.length === 0 && !customWhatIDoText.trim()) {
        setError("Please select at least one specialization or describe what you do.");
        return;
      }
      setQuestionTab(2);
    } else if (questionTab === 2) {
      if (experience.length === 0) {
        setError("Please keep at least one target experience tier selected.");
        return;
      }
      setQuestionTab(3);
    } else if (questionTab === 3) {
      if (targetRoles.length === 0) {
        setError("Please keep or add at least one target role.");
        return;
      }
      setQuestionTab(4);
    } else if (questionTab === 4) {
      setQuestionTab(5);
    } else if (questionTab === 5) {
      if (workFormat.length === 0) {
        setError("Please select at least one preferred work format.");
        return;
      }
      setQuestionTab(6);
    } else {
      setStep("account");
    }
  };

  const buildOnboardingPayload = () => {
    const synthesizedResume = synthesizeCandidateResume({
      name: name.trim(),
      selectedTrackIds: selectedTracks,
      yearsBracketId,
      exactYears,
      targetRoles,
      requiredSkills,
      niceToHaveSkills,
      workFormat,
      salaryMinimum: salaryMinimum.trim() || null,
      salaryCurrency,
      portfolioUrl: portfolioUrl.trim() || undefined,
      userNotes: [customWhatIDoText.trim(), userNotes.trim()].filter(Boolean).join("\n"),
    });

    return {
      name: profileName.trim() || targetRoles[0] || "Default",
      selectedTracks,
      yearsBracketId,
      exactYears: exactYears.trim(),
      customWhatIDoText: customWhatIDoText.trim(),
      targetRoles,
      searchKeywordsEn,
      searchKeywordsRu,
      requiredSkills,
      niceToHaveSkills,
      experience,
      workFormat,
      excludeKeywords,
      redFlagKeywords: ["паспорт", "залог", "unpaid", "бесплатное тестовое задание"],
      salaryMinimum: salaryMinimum.trim() ? parseInt(salaryMinimum.trim(), 10) || null : null,
      salaryCurrency,
      minimumScoreToNotify,
      maxNotificationsPerDay: 20,
      coverLetterLanguage,
      portfolioUrl: portfolioUrl.trim(),
      userNotes: userNotes.trim(),
      resumeText: synthesizedResume,
      uiLanguage: uiLang,
    };
  };

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(cleanEmail)) {
      setLoading(false);
      router.push("/");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          onboardingProfile: buildOnboardingPayload(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      try {
        localStorage.removeItem("hh_settings_cache_v2");
      } catch {}

      setStep("otp");
      setResendCooldown(60);
    } catch {
      setError("Network error while creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      code: code.trim(),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error || "Invalid or expired verification code.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div
        className={`w-full ${
          step === "questions" ? "max-w-2xl" : "max-w-md"
        } relative z-10 transition-all duration-200`}
      >
        {/* Top Bar: Logo, Title & Multilingual Switcher */}
        <div className="flex flex-col items-center mb-5 text-center">
          <div className="flex items-center justify-between w-full mb-3">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Home</span>
            </Link>

            {/* Language Switcher for Questionnaire Prompts */}
            <div className="inline-flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
              <Globe size={12} className="text-zinc-500 ml-1.5 mr-0.5" />
              {(
                [
                  { code: "en", label: "EN" },
                  { code: "ru", label: "RU" },
                  { code: "uk", label: "UA" },
                  { code: "uz", label: "UZ" },
                ] as const
              ).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setUiLang(l.code)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all active:scale-95 ${
                    uiLang === l.code
                      ? "bg-emerald-500 text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <BrandLogo size={42} className="mb-2.5 drop-shadow-md" />
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">{BRAND_NAME}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {step === "questions"
              ? copy.stepCounter(questionTab)
              : step === "account"
              ? copy.accountReady
              : copy.verifyEmail}
          </p>

          {/* Interactive 6-Question Stepper */}
          {step === "questions" && (
            <div className="flex items-center gap-1.5 mt-3.5 w-full max-w-md">
              {([1, 2, 3, 4, 5, 6] as const).map((qNum) => {
                const isCurrent = questionTab === qNum;
                const isCompleted = questionTab > qNum;
                return (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => {
                      setError(null);
                      setQuestionTab(qNum);
                    }}
                    aria-label={`Question ${qNum}`}
                    className={`h-2 flex-1 rounded-full transition-all active:scale-95 ${
                      isCurrent
                        ? "bg-emerald-400 ring-2 ring-emerald-500/30"
                        : isCompleted
                        ? "bg-emerald-600/80 hover:bg-emerald-500"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-zinc-900/65 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium leading-relaxed mb-4">
              {error}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 1: 6-QUESTION MULTILINGUAL ONBOARDING WIZARD
              ═══════════════════════════════════════════════════════════ */}
          {step === "questions" && (
            <div className="space-y-5">
              {/* Language recognition banner */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400">
                <span>{copy.langHint}</span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("account");
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium shrink-0 transition-colors"
                >
                  {copy.skipToAccountBtn}
                </button>
              </div>

              {/* ── QUESTION 1: What do you do & Specialization Tracks ── */}
              {questionTab === 1 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Briefcase size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q1Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q1Sub}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                    {TRACK_PRESETS.map((track) => {
                      const active = selectedTracks.includes(track.id);
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handleToggleTrack(track.id)}
                          className={`text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${
                            active
                              ? "bg-emerald-500/10 border-emerald-500/50 text-zinc-100 shadow-sm"
                              : "bg-zinc-950/70 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold leading-snug">
                              {track.labels[uiLang]}
                            </span>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                active
                                  ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              {active && <Check size={11} strokeWidth={2.5} />}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            {track.subtitles[uiLang]}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label
                      htmlFor="onboard-custom-what-i-do"
                      className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                    >
                      {copy.q1CustomLabel}
                    </label>
                    <input
                      id="onboard-custom-what-i-do"
                      type="text"
                      value={customWhatIDoText}
                      onChange={(e) => handleCustomTextChange(e.target.value)}
                      placeholder={copy.q1CustomPlaceholder}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ── QUESTION 2: Years of Experience & Seniority Calibration ── */}
              {questionTab === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Clock size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q2Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q2Sub}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      {copy.q2BracketLabel}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {YEARS_BRACKETS.map((b) => {
                        const active = yearsBracketId === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectYearsBracket(b.id)}
                            className={`text-left p-2.5 rounded-xl border transition-all active:scale-[0.98] ${
                              active
                                ? "bg-emerald-500/10 border-emerald-500/50 text-zinc-100"
                                : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold">{b.yearsLabel[uiLang]}</span>
                              {active && <Check size={13} className="text-emerald-400 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {b.seniorityLabel[uiLang]}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start pt-1">
                    <div>
                      <label
                        htmlFor="onboard-exact-years"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q2ExactYearsLabel}
                      </label>
                      <input
                        id="onboard-exact-years"
                        type="text"
                        value={exactYears}
                        onChange={(e) => setExactYears(e.target.value)}
                        placeholder={copy.q2ExactYearsPlaceholder}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        {copy.q2HhTiersLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {HH_EXPERIENCE_TIERS.map((tier) => {
                          const checked = experience.includes(tier.value);
                          return (
                            <button
                              key={tier.value}
                              type="button"
                              onClick={() => toggleMultiChoice(experience, setExperience, tier.value)}
                              className={`text-left px-2.5 py-2 rounded-lg border text-[11px] font-medium flex items-center justify-between gap-1.5 transition-all active:scale-[0.98] ${
                                checked
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                              }`}
                            >
                              <span className="truncate">{tier.labels[uiLang]}</span>
                              {checked && <Check size={12} className="text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QUESTION 3: Target Roles & Bilingual Search Keywords (EN + RU/CIS) ── */}
              {questionTab === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q3Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q3Sub}</p>
                    </div>
                  </div>

                  <TagInput
                    id="onboard-target-roles"
                    label={copy.q3RolesLabel}
                    value={targetRoles}
                    onChange={(nextRoles) => {
                      setTargetRoles(nextRoles);
                      const { searchKeywordsEn: kwEn, searchKeywordsRu: kwRu } =
                        expandBilingualKeywords({
                          selectedTrackIds: selectedTracks,
                          targetRoles: nextRoles,
                          customKeywordsEn: searchKeywordsEn,
                          customKeywordsRu: searchKeywordsRu,
                          freeTextBio: customWhatIDoText,
                        });
                      setSearchKeywordsEn(kwEn);
                      setSearchKeywordsRu(kwRu);
                    }}
                    catalog={ROLES}
                    placeholder="Frontend Developer, Разработчик, Розробник, Dasturchi..."
                  />

                  <TagInput
                    id="onboard-keywords-en"
                    label={copy.q3KeywordsEnLabel}
                    value={searchKeywordsEn}
                    onChange={setSearchKeywordsEn}
                    catalog={ROLES}
                    placeholder="Add English search queries (e.g. react developer, full stack)..."
                  />

                  <TagInput
                    id="onboard-keywords-ru"
                    label={copy.q3KeywordsRuLabel}
                    value={searchKeywordsRu}
                    onChange={setSearchKeywordsRu}
                    catalog={KEYWORDS_RU}
                    placeholder="Add Russian / CIS search queries (e.g. фронтенд разработчик)..."
                  />
                </div>
              )}

              {/* ── QUESTION 4: Core Tech Stack & Bonus Skills ── */}
              {questionTab === 4 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Code2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q4Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q4Sub}</p>
                    </div>
                  </div>

                  <TagInput
                    id="onboard-required-skills"
                    label={copy.q4CoreSkillsLabel}
                    value={requiredSkills}
                    onChange={setRequiredSkills}
                    catalog={SKILLS}
                    placeholder="React, TypeScript, Python, Figma, SQL..."
                  />

                  <TagInput
                    id="onboard-nice-skills"
                    label={copy.q4BonusSkillsLabel}
                    value={niceToHaveSkills}
                    onChange={setNiceToHaveSkills}
                    catalog={SKILLS}
                    placeholder="Docker, Next.js, Tailwind CSS, Webflow, PostgreSQL..."
                  />
                </div>
              )}

              {/* ── QUESTION 5: Work Format, Salary, Exclude Keywords & AI Rules ── */}
              {questionTab === 5 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Sliders size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q5Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q5Sub}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      {copy.q5WorkFormatLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {WORK_FORMATS.map((opt) => {
                        const checked = workFormat.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleMultiChoice(workFormat, setWorkFormat, opt.value)}
                            className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                              checked
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            {checked && <Check size={12} className="text-emerald-400" />}
                            <span>{opt.labels[uiLang]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <TagInput
                    id="onboard-exclude-keywords"
                    label={copy.q5ExcludeLabel}
                    value={excludeKeywords}
                    onChange={setExcludeKeywords}
                    catalog={EXCLUDE_KEYWORDS}
                    placeholder="e.g. Senior, 1C, PHP, Cold calling..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label
                        htmlFor="onboard-salary"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q5SalaryLabel}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          id="onboard-salary"
                          type="number"
                          value={salaryMinimum}
                          onChange={(e) => setSalaryMinimum(e.target.value)}
                          placeholder="150000"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                        />
                        <select
                          aria-label="Salary currency"
                          value={salaryCurrency}
                          onChange={(e) => setSalaryCurrency(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-200 focus:outline-none"
                        >
                          <option value="RUR">RUR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="UZS">UZS</option>
                          <option value="KZT">KZT</option>
                          <option value="UAH">UAH</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="onboard-cl-lang"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q5CoverLetterLangLabel}
                      </label>
                      <select
                        id="onboard-cl-lang"
                        value={coverLetterLanguage}
                        onChange={(e) => setCoverLetterLanguage(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="Auto (Match Vacancy Language)">Auto (Match Vacancy)</option>
                        <option value="Russian">Russian (Русский)</option>
                        <option value="English">English</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="onboard-min-score"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q5MatchScoreLabel}
                      </label>
                      <select
                        id="onboard-min-score"
                        value={minimumScoreToNotify}
                        onChange={(e) => setMinimumScoreToNotify(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value={65}>65% (Broad Discovery)</option>
                        <option value={70}>70% (Balanced Recommended)</option>
                        <option value={80}>80% (High Synergy Only)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── QUESTION 6: Projects / Career Goals (Any Language), Portfolio & Profile Name ── */}
              {questionTab === 6 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <FileText size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">{copy.q6Title}</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">{copy.q6Sub}</p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="onboard-user-notes"
                      className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                    >
                      {copy.q6NotesLabel}
                    </label>
                    <textarea
                      id="onboard-user-notes"
                      rows={3}
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder={copy.q6NotesPlaceholder}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="onboard-portfolio-url"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q6PortfolioLabel}
                      </label>
                      <div className="relative">
                        <Link2
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                        />
                        <input
                          id="onboard-portfolio-url"
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://github.com/yourname"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="onboard-profile-name"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        {copy.q6ProfileNameLabel}
                      </label>
                      <input
                        id="onboard-profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Full Stack & Web"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Preview of Synthesized AI Candidate Profile */}
                  <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                        Auto-Generated Profile Preview
                      </span>
                      <span className="text-zinc-500">
                        {targetRoles.length} roles · {requiredSkills.length} core skills ·{" "}
                        {searchKeywordsEn.length + searchKeywordsRu.length} EN/RU queries
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-3 whitespace-pre-line leading-relaxed">
                      {synthesizeCandidateResume({
                        selectedTrackIds: selectedTracks,
                        yearsBracketId,
                        exactYears,
                        targetRoles,
                        requiredSkills,
                        niceToHaveSkills,
                        workFormat,
                        salaryMinimum: salaryMinimum.trim() || null,
                        salaryCurrency,
                        portfolioUrl,
                        userNotes: [customWhatIDoText.trim(), userNotes.trim()]
                          .filter(Boolean)
                          .join(" — "),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Questionnaire Navigation Footer */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                {questionTab > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setQuestionTab((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5 | 6) : 1));
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all active:scale-95"
                  >
                    <ArrowLeft size={13} />
                    <span>{copy.backBtn}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    {selectedTracks.length} track{selectedTracks.length === 1 ? "" : "s"} ·{" "}
                    {targetRoles.length} roles ready
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-5 py-2.5 text-xs transition-all active:scale-[0.98] shadow-sm shadow-emerald-950/50"
                >
                  <span>{questionTab === 6 ? copy.finishBtn : copy.nextBtn}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 2: ACCOUNT CREDENTIALS
              ═══════════════════════════════════════════════════════════ */}
          {step === "account" && (
            <form onSubmit={handleSubmitAccount} className="space-y-4">
              {/* Pre-configured Profile Summary Bar */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-200 truncate">
                    Profile: <span className="text-emerald-400">{profileName || "Default"}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {targetRoles.length} roles · {requiredSkills.length} skills ·{" "}
                    {searchKeywordsEn.length + searchKeywordsRu.length} EN/RU queries ·{" "}
                    {workFormat.join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("questions");
                  }}
                  className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] text-zinc-300 shrink-0 transition-all active:scale-95"
                >
                  {copy.editProfileBtn}
                </button>
              </div>

              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] shadow-sm shadow-emerald-950/50 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account & Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Send Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 3: 6-DIGIT EMAIL OTP VERIFICATION
              ═══════════════════════════════════════════════════════════ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-emerald-300 leading-relaxed">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-white">{email}</span>. Enter it below to
                  activate your account and launch your pre-configured profile.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reg-otp-code"
                    className="block text-xs text-zinc-400 font-medium cursor-pointer"
                  >
                    Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                  <input
                    id="reg-otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-base font-mono tracking-[0.35em] text-zinc-100 placeholder-zinc-700 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] shadow-sm shadow-emerald-950/50 mt-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying & Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Launch Dashboard</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("account");
                  setCode("");
                  setError(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 py-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back to account details</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
