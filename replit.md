Bisa. Tapi dari repo lu, ini **bukan cuma Telegram bot biasa**. Ini sebenarnya **Next.js full-stack app + Prisma/NeonDB + Telegram webhook + AI analyzer + dashboard**.

Jadi kalau dipindah ke Replit, konsepnya bukan “bot jalan sendiri pakai polling”, tapi:

```text
Replit menjalankan Next.js app
→ Telegram webhook masuk ke /api/telegram/webhook
→ App proses tombol Telegram
→ Data disimpan di NeonDB lewat Prisma
→ AI pakai Groq/Gemini/OpenRouter
→ Hasil dikirim balik ke Telegram
```

Repo lu sekarang memang didesain seperti itu: HH API dikumpulkan lewat scheduler, masuk ke Next.js API, difilter, dianalisis AI, disimpan ke NeonDB, lalu dikirim ke Telegram dengan tombol Apply/Skip/Save/Edit. Stack-nya juga sudah tertulis: Next.js 15, TypeScript, NeonDB + Prisma, Telegram Bot API, Groq/Gemini/OpenRouter, dan deployment awalnya Vercel. ([GitHub][1])

---

## 1. Kesimpulan utama: bisa pakai Replit, tapi jangan bikin ulang dari nol

Yang paling bener:

```text
GitHub repo lu
→ Import ke Replit
→ Replit menjalankan folder nanda-job-assistant
→ Set Secrets/env
→ Setup NeonDB
→ Deploy
→ Register Telegram webhook ke URL Replit
→ Jalankan collection manual / external cron
```

Yang harus lu pahami: repo lu itu monorepo kecil, karena `package.json` ada di folder:

```text
nanda-job-assistant/package.json
```

bukan di root repo. Jadi kalau Replit langsung import root repo, kemungkinan dia bingung karena root-nya cuma berisi folder `nanda-job-assistant` dan `.gitignore`. Maka ada 2 opsi:

**Opsi paling gampang:** pindahin isi folder `nanda-job-assistant` ke root repo baru khusus Replit.
**Opsi tetap pakai repo sekarang:** tambahin file `.replit` di root yang isinya selalu `cd nanda-job-assistant`.

Untuk lu, gw saranin **opsi kedua dulu**, karena nggak perlu ubah struktur repo besar-besaran.

---

## 2. File yang perlu ditambah di root repo

Di root repo, sejajar dengan folder `nanda-job-assistant`, bikin file:

```text
.replit
```

Isinya:

```toml
run = "cd nanda-job-assistant && npm run dev"

[deployment]
deploymentTarget = "autoscale"
build = ["sh", "-c", "cd nanda-job-assistant && npm install && npx prisma generate && npm run build"]
run = ["sh", "-c", "cd nanda-job-assistant && npm run start"]
```

Kenapa perlu? Karena Replit pakai `.replit` buat ngatur command run/build project. Replit docs juga jelasin `.replit` dipakai untuk run command, environment behavior, dependencies, dan workflow app. ([Replit Docs][2])

---

## 3. Update `package.json` di `nanda-job-assistant`

Package lu sekarang sudah punya script `dev`, `build`, `start`, dan script Prisma seperti `db:generate`, `db:push`, `db:seed`. Dependencies-nya juga sudah lengkap untuk Next, Prisma, Telegram bot API, Groq, Gemini, OpenAI/OpenRouter, React, dan Tailwind. ([GitHub][3])

Tapi untuk Replit, script-nya lebih aman diubah jadi begini:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "build": "prisma generate && next build",
    "start": "next start -H 0.0.0.0 -p ${PORT:-3000}",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx src/lib/seed.ts",
    "postinstall": "prisma generate"
  }
}
```

Yang penting di sini:

```text
-H 0.0.0.0
```

Supaya app bisa diakses dari luar Replit, bukan cuma localhost internal.

Dan:

```text
-p ${PORT:-3000}
```

Supaya kalau Replit kasih port sendiri saat deploy, Next.js ikut pakai port itu. Replit memang punya sistem port/proxy sendiri di cloud environment, jadi app harus listen di port yang benar. ([Replit Docs][4])

---

## 4. Secrets / Environment Variables di Replit

Jangan pakai `.env` yang di-commit. Di Replit, masuk ke:

```text
Tools / Secrets
```

lalu isi ini:

```env
DATABASE_URL=
DIRECT_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
HH_USER_AGENT=
```

Ini memang variabel yang dibutuhkan repo lu: database Neon, Telegram token/chat ID, AI keys, cron secret, app URL, dan user-agent untuk HH API. ([GitHub][1])

Replit Secrets memang tempat yang benar buat API key/token karena datanya dienkripsi dan tersedia sebagai environment variable, jadi jangan hard-code token Telegram/Groq/Gemini di source code. ([Replit Docs][5])

Catatan penting: kalau nanti lu pakai **Replit Deployments**, Secrets di editor belum tentu otomatis ikut ke production. Replit docs bilang production secrets/env harus ditambahkan juga di bagian Publishing/Deployment, karena kalau kurang bisa bikin app gagal start. ([Replit Docs][6])

---

## 5. Database NeonDB tetap dipakai

Project lu sekarang pakai Prisma + PostgreSQL dengan `DATABASE_URL` dan `DIRECT_URL`. Schema-nya punya model penting seperti:

```text
UserProfile
SearchPreference
Vacancy
VacancyAnalysis
VacancyFeedback
ApplicationLog
AiUsageLog
```

Jadi Replit **nggak menggantikan database**. Replit cuma tempat jalanin app. Database tetap NeonDB. ([GitHub][7])

Setelah Secrets sudah masuk, buka Shell Replit lalu jalankan:

```bash
cd nanda-job-assistant
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Kalau berhasil, dashboard lu harus kebuka di:

```text
/dashboard
```

---

## 6. Setup Telegram webhook ke Replit

Bot lu sekarang memakai webhook route:

```text
/api/telegram/webhook
```

Route itu menerima update dari Telegram, handle tombol inline keyboard, lalu proses action seperti `approve`, `skip`, `save`, `edit`, dan `profile`. Di code lu, tombol `edit` sekarang langsung regenerate cover letter, bukan mode chat edit instruksi manual. ([GitHub][8])

Setelah Replit app punya URL publik, set:

```env
NEXT_PUBLIC_APP_URL=https://NAMA-APP-REPLIT-LU
```

Lalu register webhook:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://NAMA-APP-REPLIT-LU/api/telegram/webhook"}'
```

Kalau sebelumnya webhook masih nyangkut ke Vercel/ngrok/n8n, hapus dulu:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook?drop_pending_updates=true"
```

Baru set webhook lagi ke Replit.

Telegram sendiri bilang bot update itu ada 2 cara yang saling eksklusif: `getUpdates` atau webhook. Jadi jangan pakai polling dan webhook barengan, nanti bisa conflict. ([Telegram][9])

---

## 7. Bagian scheduler: n8n bisa diganti atau tetap dipakai

Di arsitektur lama, n8n tugasnya cuma scheduler: setiap beberapa jam dia memanggil endpoint Next.js:

```text
/api/cron/collect-vacancies
```

README repo lu memang menjelaskan flow-nya: n8n scheduler → Next.js API `/api/cron/collect-vacancies` → filter → AI analysis → NeonDB → Telegram. ([GitHub][1])

Kalau pindah ke Replit, ada 3 pilihan:

### Pilihan A — tetap pakai n8n/Make/Pipedream sebagai scheduler

Ini paling gampang. Replit jalanin app, lalu scheduler eksternal panggil:

```bash
curl "https://NAMA-APP-REPLIT-LU/api/cron/collect-vacancies?secret=CRON_SECRET_LU"
```

### Pilihan B — pakai dashboard manual

Lu buka dashboard, klik run collection. Di repo ada shared `collectionPipeline`, jadi collection bisa dipakai oleh cron route dan dashboard route. Pipeline itu load active preference, collect vacancy dari HH API, dedupe, filter, scoring, AI analysis, save DB, dan kirim Telegram notification kalau score memenuhi threshold. ([GitHub][10])

### Pilihan C — bikin scheduler kecil di Replit

Bisa, tapi gw kurang saranin untuk awal. Lebih baik jangan campur long-running cron di Next.js app dulu. Pakai external cron lebih stabil.

---

## 8. Issue penting sebelum lu deploy ke Replit

Ada beberapa hal yang perlu lu perhatikan.

### A. Next.js lu masih `15.1.6`

Di `package.json`, project lu pakai:

```json
"next": "15.1.6"
```

([GitHub][3])

Untuk Replit mungkin tetap jalan, tapi ini bisa jadi masalah security/deployment. Next.js docs sekarang menampilkan versi latest 16.2.6 dan minimum Node.js 20.9. ([Next.js][11])

Saran aman:

```bash
cd nanda-job-assistant
npm install next@latest react@latest react-dom@latest
```

Kalau build error karena Next 16 terlalu baru, pakai patched Next 15 terbaru. Tapi jangan biarin di `15.1.6`.

### B. `Edit Letter` belum benar-benar “edit berdasarkan instruksi”

Dari code, tombol `edit` sekarang melakukan ini:

```text
klik Edit
→ call AI lagi
→ parse cover_letter baru
→ update VacancyAnalysis.coverLetter
→ kirim cover letter baru ke Telegram
```

Belum ada alur:

```text
klik Edit
→ bot nanya “mau diedit gimana?”
→ lu kirim instruksi
→ AI revisi berdasarkan instruksi
```

Jadi fitur yang ada sekarang adalah **regenerate letter**, bukan **custom edit letter**. Ini kelihatan dari handler `handleEdit()` dan switch action `case "edit"` yang langsung memanggil AI lalu `sendMessage`. ([GitHub][8])

Kalau lu mau fitur edit beneran, nanti perlu tambah state/session, misalnya model baru:

```prisma
model TelegramSession {
  id        String   @id @default(cuid())
  chatId    String   @unique
  mode      String
  vacancyId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Lalu alurnya:

```text
Edit Letter clicked
→ save session: waiting_for_edit_instruction
→ bot tanya instruksi
→ user kirim instruksi
→ AI rewrite previous cover letter
→ update DB
→ kirim hasil baru
```

### C. Ada `$transaction` di profile switch

Di webhook route, action `profile` memakai `prisma.$transaction` untuk menonaktifkan semua profile lalu mengaktifkan profile baru. ([GitHub][8])

Kalau Neon/Prisma lu nanti error seperti:

```text
Transactions are not supported in HTTP mode
```

ubah bagian itu jadi dua query biasa:

```ts
await prisma.searchPreference.updateMany({
  data: { isActive: false },
});

await prisma.searchPreference.update({
  where: { id: vacancyId },
  data: { isActive: true },
});
```

Ini bukan wajib kalau database lu normal PostgreSQL connection, tapi perlu diingat karena lu sebelumnya pernah kena error transaction di Neon/Prisma.

---

## 9. Alur final di Replit nanti

Nanti jadinya gini:

```text
1. Replit menjalankan Next.js app
2. NeonDB menyimpan semua vacancy, analysis, feedback, logs
3. Telegram webhook diarahkan ke Replit:
   /api/telegram/webhook
4. External cron/manual dashboard memanggil:
   /api/cron/collect-vacancies
5. Bot kirim vacancy bagus ke Telegram
6. Lu klik:
   ✅ Mark Applied
   ❌ Skip
   💾 Save
   ✍️ Edit Letter
7. Webhook Replit menerima tombol itu
8. Prisma update database
9. Bot kirim response balik
```

---

## 10. Urutan eksekusi yang gw saranin

Pakai urutan ini biar nggak mumet:

```text
Step 1: Import repo ke Replit
Step 2: Tambah .replit di root
Step 3: Update package.json script
Step 4: Masukkan semua Secrets
Step 5: Jalankan npm install
Step 6: Jalankan npx prisma generate
Step 7: Jalankan npm run db:push
Step 8: Jalankan npm run db:seed
Step 9: Run dev dulu
Step 10: Deploy Replit
Step 11: Set NEXT_PUBLIC_APP_URL ke URL Replit
Step 12: Register Telegram webhook
Step 13: Test /start di bot
Step 14: Test collect vacancy
```

Jadi jawabannya: **bisa banget pakai Replit**, tapi bentuknya bukan “Replit buat bot doang”. Replit akan jadi **hosting utama untuk Next.js app lu**, sedangkan Telegram cuma masuk lewat webhook. Yang perlu dibenerin paling penting adalah `.replit`, `package.json` script, env/secrets, webhook URL, dan kalau mau fitur edit beneran perlu tambah session/state.

[1]: https://github.com/nnavyy/automation-vacancy-finder/tree/main/nanda-job-assistant "automation-vacancy-finder/nanda-job-assistant at main · nnavyy/automation-vacancy-finder · GitHub"
[2]: https://docs.replit.com/core-concepts/project-editor/app-setup/configuration?utm_source=chatgpt.com "Replit App Configuration"
[3]: https://github.com/nnavyy/automation-vacancy-finder/blob/main/nanda-job-assistant/package.json "automation-vacancy-finder/nanda-job-assistant/package.json at main · nnavyy/automation-vacancy-finder · GitHub"
[4]: https://docs.replit.com/core-concepts/project-editor/app-setup/ports?utm_source=chatgpt.com "Ports"
[5]: https://docs.replit.com/core-concepts/project-editor/app-setup/secrets?utm_source=chatgpt.com "Secrets"
[6]: https://docs.replit.com/cloud-services/deployments/troubleshooting?utm_source=chatgpt.com "Troubleshoot publishing"
[7]: https://github.com/nnavyy/automation-vacancy-finder/raw/refs/heads/main/nanda-job-assistant/prisma/schema.prisma "raw.githubusercontent.com"
[8]: https://github.com/nnavyy/automation-vacancy-finder/blob/main/nanda-job-assistant/src/app/api/telegram/webhook/route.ts "automation-vacancy-finder/nanda-job-assistant/src/app/api/telegram/webhook/route.ts at main · nnavyy/automation-vacancy-finder · GitHub"
[9]: https://core.telegram.org/bots/api?utm_source=chatgpt.com "Telegram Bot API"
[10]: https://github.com/nnavyy/automation-vacancy-finder/raw/refs/heads/main/nanda-job-assistant/src/lib/collectionPipeline.ts "raw.githubusercontent.com"
[11]: https://nextjs.org/docs/app/getting-started/installation?utm_source=chatgpt.com "Getting Started: Installation"
