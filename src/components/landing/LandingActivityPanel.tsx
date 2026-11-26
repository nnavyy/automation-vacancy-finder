"use client";

import { useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/i18n";

export interface LandingActivitySnapshot {
  indexedVacancies: number;
  completedAssessments: number;
  trackedApplications: number;
  measuredAt: string;
}

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export default function LandingActivityPanel({ snapshot }: { snapshot?: LandingActivitySnapshot | null }) {
  const { language } = useLanguage();
  const hydrated = useSyncExternalStore(subscribeToHydration, clientHydrated, serverHydrated);
  // The streamed panel can hydrate after the landing has restored its saved language.
  const ru = !hydrated || language === "ru";
  const locale = ru ? "ru-RU" : "en-US";
  const copy = (r: string, e: string) => ru ? r : e;
  const metrics = snapshot && [
    { value: snapshot.indexedVacancies, label: copy("Вакансии в общем каталоге", "Vacancies in the shared index"), detail: copy("Объявления HeadHunter, доступные поиску в сервисе.", "HeadHunter listings available to search in Job Copilot.") },
    { value: snapshot.completedAssessments, label: copy("Завершённые оценки", "Completed assessments"), detail: copy("Вакансии с готовой AI-оценкой для конкретного профиля.", "Completed AI match assessments against individual search profiles.") },
    { value: snapshot.trackedApplications, label: copy("Отслеживаемые отклики", "Applications tracked"), detail: copy("Вакансии, в которых сервис зафиксировал отклик.", "Vacancy records that were marked as applied.") },
  ];

  return (
    <section id="activity" className="field-activity field-wrap field-section" aria-labelledby="field-activity-title">
      <div className="field-activity-heading">
        <h2 id="field-activity-title">{copy("Поиск в цифрах", "The search in numbers")}</h2>
        <div>
          <p>{copy("Сводные данные HH Job Copilot.", "Aggregate activity from HH Job Copilot.")}</p>
          {snapshot && <time dateTime={snapshot.measuredAt}>
            {copy("Обновлено", "Updated")} {new Date(snapshot.measuredAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC
          </time>}
        </div>
      </div>
      {metrics ? (
        <dl className="field-metrics">
          {metrics.map(({ value, label, detail }) => <div key={label} className="field-metric">
            <dt>{label}</dt>
            <dd><strong>{value.toLocaleString(locale)}</strong><span>{detail}</span></dd>
          </div>)}
        </dl>
      ) : (
        <p className="field-activity-status" role="status">
          {snapshot === null
            ? copy("Данные временно недоступны.", "Activity data is temporarily unavailable.")
            : copy("Загружаем данные…", "Loading activity data…")}
        </p>
      )}
    </section>
  );
}
