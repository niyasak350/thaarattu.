# Thaaraattu: pregnancy and baby care companion

A full-stack web app that supports a mother from pregnancy through the baby's first years.
The app name can be changed by the admin (Admin > Site Settings).

- **Frontend:** React (Vite), React Router, Recharts, lucide icons
- **Backend:** Node.js, Express
- **Database:** MySQL

## Who uses it

| Account | How it is made | What they do |
|---|---|---|
| **Parent** | Registers on the site | Pregnancy tracker, baby care, wellbeing, records, booking |
| **Doctor** | The hospital admin (or site admin) adds the doctor with a login | Appointments, own timing and fee, records that patients share |
| **Hospital admin** | The site admin adds the hospital with an admin login | Hospital details, its doctors and their logins, its appointments and reviews |
| **Site admin** | Comes with the database (`admin@spa.com`) | Everything: users, hospitals, content, settings |

The login page asks "Parent / Doctor / Hospital admin". The site admin can log in from any of them.

## Features

**Pregnancy**
- Tracker: current week, trimester, due date, days to go
- Week-by-week guide, food guide by trimester
- Check-ups: set dates, edit, mark done, typical schedule, alerts on the home page
- Kick counter and contraction timer

**Baby**
- Child profiles, growth charts with WHO median, vaccination schedule with PDF report
- Meal ideas with allergy alerts, health records, care guide by age
- Photo album for each child

**Mother's wellbeing**
- Mood tracker, weekly wellbeing screening, sleep and recovery, self-care, guided breathing, journal
- Games: memory match, bubble pop, quiz

**Health record**
- One combined record of the mother and her children, by day, week or month
- Health readings: weight, blood pressure, sugar
- Sharing: a doctor sees the record only if the parent switches sharing on for that doctor
  (at booking, or under Records > Sharing). It can be switched off at any time.
  The journal and private mood notes are never shared.

**Doctors and hospitals**
- Search, distance, ratings, reviews, appointment booking
- Doctor panel and hospital admin panel (see the table above)
- Emergency helplines, AI assistant (Google Gemini), videos chosen by the admin

**Look and feel**
- Clean premium design: bright white, bold tight headings, one dark pink accent, soft rounded panels
- Mother-and-baby illustration on the first page and intro (replaced by your own photo if you upload one)
- Simple first page; light and dark theme
- Opening screen on every visit: built-in animation, or a video the admin sets by link
- A doctor walks in on the home page and reads out reminders one by one
- Add forms stay hidden behind an "Add" button so the page shows what matters first

**Site admin**
- Site settings: app name, tagline, first page picture, intro video link, Creators page text
- First page photos, creators, videos (YouTube links)
- Users of every role: edit, change role, reset password, block, delete
- Hospitals (with admin logins), doctors (with logins), appointments, reviews
- Pregnancy guide, pregnancy foods, baby guide, baby meals, vaccines, quiz, affirmations, feedback

English and Malayalam for the menu, headings and main buttons. Works on computers, tablets and phones.

## Run it on Ubuntu

You need Node.js 18 or newer and MySQL.

```
bash setup.sh        # one time: creates the database, settings file, installs packages
npm run dev          # every time: starts the app
```

Open http://localhost:5173

- **Admin login:** `admin@spa.com` / `admin123` (security answer: `admin`). Change these from the Profile page.
- **Parents:** click "Get started" to create an account.

`setup.sh` creates a database called `thaaraattu`, a MySQL user `spa` (password `Thaaraattu@2026`) and writes `server/.env`.

### Manual setup (Windows, or if you prefer)

1. Import `database/app.sql` into MySQL (phpMyAdmin > Import, or `mysql -u root -p < database/app.sql`).
2. Copy `server/.env.example` to `server/.env` and set `DB_USER`, `DB_PASSWORD` and `JWT_SECRET`.
3. Run `npm install` in the project folder, in `server` and in `client`.
4. Run `npm run dev` in the project folder.

## Making doctor and hospital logins

1. Log in as the site admin > **Hospitals & Doctors** > **Add a hospital** (or Edit one) and fill in
   "Hospital administrator's login".
2. The hospital admin logs in (choose "Hospital admin" on the login page) > **Doctors** > **Add a doctor**
   and fills in "Doctor's login".
3. The doctor logs in (choose "Doctor").

The site admin can also add doctors and logins directly.

## Folder structure

```
database/app.sql        tables + starter content (import this)
setup.sh                one-time setup for Ubuntu
server/                 Node + Express API
  src/index.js          starts the server
  src/db.js             MySQL connection
  src/content.js        list of admin-managed content types
  src/migrate.js        adds new tables to an older database when the server starts
  src/records.js        builds the combined health record
  src/doctors.js        shared rules for hospitals and doctors
  src/middleware/       login check, admin check
  src/routes/           auth, pregnancy, children, wellness, care, records, doctor, hospital, assistant, admin
client/                 React app
  src/App.jsx           all pages (routes)
  src/styles.css        colours and design (change the variables at the top)
  src/i18n.jsx          English / Malayalam words
  src/components/       menu layout, intro, logo, walking doctor, health record view
  src/theme.jsx         light / dark theme
  src/pages/            parent pages
  src/pages/admin/      site admin pages
  src/pages/doctor/     doctor pages
  src/pages/hospital/   hospital admin pages
```

## Changing the intro video

Log in as admin > **Site Settings** > **Video link**, then Save. You can use:

- a YouTube link (shown for the number of seconds you set), or
- a direct link to an `.mp4` / `.webm` file (closes when the video ends), or
- your own file: copy it to `client/public/intro.mp4` and enter `/intro.mp4`.

Leave the link empty to use the built-in animation. Videos play muted because browsers
block sound on autoplay. Viewers can always press Skip.

## Changing colours

All colours are variables at the top of `client/src/styles.css` (one set for light, one for dark).

## Turning on the AI assistant

1. Create a free API key at https://aistudio.google.com/apikey
2. Put it in `server/.env`: `GEMINI_API_KEY=your_key_here`
3. Restart the app.

If the assistant shows "The AI service returned an error", look up the current model name in
the Gemini API docs and set `GEMINI_MODEL` in `server/.env`.

## Putting it on GitHub

```
git init
git add .
git commit -m "Pregnancy and baby care app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

`.gitignore` keeps `node_modules` and `server/.env` (passwords, API key) out of GitHub.
The database is shared as `database/app.sql`. If you change tables, export again from
phpMyAdmin (structure and starter content only, not real users' data) and commit the file.

## Hosting it online

GitHub only stores code. A live site also needs an online MySQL-compatible database and a
service that runs Node. Free plans change often, so check current limits.

1. **Database** (example: TiDB Cloud): create a cluster, run `database/app.sql` there, note the
   host, port, user and password.
2. **App** (example: Render): New > Web Service > connect the GitHub repo.
   Build command `npm run build`, start command `npm start`.
   Environment variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=thaaraattu`,
   `DB_SSL=true`, `JWT_SECRET`, `GEMINI_API_KEY`.

The server then serves the website and the API from one address. This was tested locally with
MariaDB only, not on TiDB Cloud or Render.

## Before real use

The starter content was written for this project and is general information, not medical advice.
Have a doctor review it, and check these against official sources. The admin can edit all of it.

- Pregnancy guide, food guide, baby guide, quiz answers
- Typical check-up schedule (`server/src/routes/pregnancy.js`)
- Vaccine list (based on India's Universal Immunization Programme)
- WHO growth medians (`client/src/whoData.js`)
- Weekly screening questions (`client/src/pages/wellness/ScreeningTab.jsx`): not a validated clinical scale
- Helpline numbers (`client/src/pages/care/Emergency.jsx`)
- Hospitals and doctors are demo entries: add real ones from the admin panel
- The first page shows the mother-and-baby illustration until you upload your own photo (one you have permission to use) in Site Settings
- Photos are stored inside the database as text, which is fine for a project but not for thousands of photos

Not included: email or SMS (alerts are in-app and browser notifications), Google login.
# thaarattu.
