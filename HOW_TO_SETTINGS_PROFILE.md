# How to Setup Your Profile & Settings

This guide will help you configure your **Nanda AI Job Assistant** profile so the AI can accurately match you with the best job vacancies. All configurations can be managed directly in your dashboard at `http://localhost:3000/dashboard/settings`.

---

## 1. Connecting Your HH.ru Account (Token)

The `HH.ru Token` is a secure cookie used to connect the assistant to your private HH.ru account. This allows the system to synchronize your application history (Negotiations) in real-time. 

Without this token, the assistant can still find jobs, but it won't be able to track if you've already applied or if the employer has invited you for an interview.

**Step-by-step to get your HH.ru Token:**
1. Open [hh.ru](https://hh.ru) in your desktop browser and log into your account.
2. Press `F12` on your keyboard to open **Developer Tools** (or Right-Click -> Inspect).
3. Navigate to the **Application** tab (if you are using Chrome/Edge) or the **Storage** tab (if you are using Firefox).
4. On the left sidebar, expand **Cookies** and click on `https://hh.ru`.
5. Look at the list on the right and find the Name: `hhtoken`.
6. Copy its **Value**.
7. Paste this value into the **HH.ru Token** field in your Settings dashboard and click Save.

*Note: The token usually expires after a few weeks. If your dashboard stops syncing your latest applied jobs, you may need to grab the newest token and update it.*

---

## 2. Configuring AI Preferences (JSON)

The AI and the search scraper use your dashboard fields to filter and score jobs. Many of these fields require a **JSON Array** format. This means it must be a list of text strings enclosed in square brackets `[ ]`.

### Basic Formatting Rules
Make sure you use **double quotes** for each word and separate them with commas.
- **Correct:** `["React", "Node.js", "TypeScript"]`
- **Incorrect:** `[React, Node.js]` *(Missing quotes)*
- **Incorrect:** `['React', 'Node.js']` *(Using single quotes instead of double quotes)*

### Field Explanations

#### `targetRoles` (Target Roles)
The exact job titles you are looking for. The AI uses this to check if the vacancy title matches your career path.
*Example:* `["Frontend Developer", "Full-Stack Engineer", "React Developer"]`

#### `searchKeywordsEn` & `searchKeywordsRu`
Keywords passed directly to the HH.ru public search engine to pull initial vacancies before AI analysis.
*Example:* `["React", "Next.js", "Frontend"]`

#### `requiredSkills` (Required Skills)
Skills that are an absolute MUST for you. If a vacancy requires skills that you don't have, the AI will drastically lower its score to save your time.
*Example:* `["JavaScript", "TypeScript", "React", "Git"]`

#### `niceToHaveSkills`
Bonus skills that increase your match score if the employer happens to want them.
*Example:* `["Docker", "GraphQL", "Figma", "TailwindCSS"]`

#### `excludeKeywords`
Technologies or words that automatically disqualify a job (Score drops to 0 immediately).
*Example:* `["PHP", "Angular", "Vue", "1C", "Bitrix", "WordPress"]`

#### `redFlagKeywords`
Toxic phrases that lower the job score. This protects you from bad company cultures.
*Example:* `["stress tolerance", "work hard play hard", "overtime", "fast-paced environment"]`

---

## 3. Saving & Activating

Once you have filled out your token and properly formatted your JSON arrays, click **Save Settings** at the bottom of the page. 

The background worker (n8n) will immediately start using these new preferences during its next scheduled run, and your dashboard will automatically refresh your HH.ru application history based on the token!
