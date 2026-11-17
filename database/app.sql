-- Pregnancy & baby care app - database schema + starter data
-- Import: phpMyAdmin > Import, or
--   mysql -u root -p < database/app.sql

CREATE DATABASE IF NOT EXISTS thaaraattu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thaaraattu;

-- (these five are created by the server when it starts: see server/src/migrate.js)
DROP TABLE IF EXISTS site_photos;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS child_photos;
DROP TABLE IF EXISTS vitals;
DROP TABLE IF EXISTS record_shares;
DROP TABLE IF EXISTS creators;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS baby_guides;
DROP TABLE IF EXISTS affirmations;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS pregnancy_foods;
DROP TABLE IF EXISTS pregnancy_guides;
DROP TABLE IF EXISTS contractions;
DROP TABLE IF EXISTS kick_sessions;
DROP TABLE IF EXISTS checkups;
DROP TABLE IF EXISTS pregnancies;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS selfcare_done;
DROP TABLE IF EXISTS sleep_logs;
DROP TABLE IF EXISTS screenings;
DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS health_records;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS mood_logs;
DROP TABLE IF EXISTS child_vaccinations;
DROP TABLE IF EXISTS growth_records;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS vaccines;
DROP TABLE IF EXISTS users;

-- Parents and admins
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  security_question VARCHAR(150),    -- used for "Forgot password"
  security_answer_hash VARCHAR(255),
  role ENUM('parent','admin','doctor','hospital_admin') NOT NULL DEFAULT 'parent',
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Child profiles (one parent can have many children)
CREATE TABLE children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  blood_group VARCHAR(5),
  allergies VARCHAR(255),            -- comma separated, e.g. "milk, egg"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Height / weight entries for the growth tracker
CREATE TABLE growth_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  record_date DATE NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Master list of vaccines (managed by admin)
CREATE TABLE vaccines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  due_age_weeks INT NOT NULL,
  description VARCHAR(255)
);

-- Each child's personal vaccine schedule (auto-created from DOB)
CREATE TABLE child_vaccinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  vaccine_id INT NOT NULL,
  due_date DATE NOT NULL,
  given_date DATE NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE
);

-- Mother's daily mood tracker (one entry per day)
CREATE TABLE mood_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  mood TINYINT NOT NULL,           -- 1 (very low) to 5 (great)
  stress TINYINT NOT NULL,         -- 1 (calm) to 5 (very stressed)
  note VARCHAR(500),
  UNIQUE KEY one_per_day (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback from parents to admin
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fever, medicines, doctor visits, symptoms
CREATE TABLE health_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_id INT NOT NULL,
  record_date DATE NOT NULL,
  type ENUM('fever','medicine','doctor_visit','symptom','other') NOT NULL,
  title VARCHAR(150) NOT NULL,
  details VARCHAR(500),
  temperature_c DECIMAL(4,1) NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Age-wise meal ideas (managed by admin)
CREATE TABLE meal_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  min_months INT NOT NULL,
  max_months INT NOT NULL,
  meal_type ENUM('breakfast','lunch','snack','dinner','anytime') NOT NULL,
  title VARCHAR(150) NOT NULL,
  recipe VARCHAR(1000),
  allergens VARCHAR(255)             -- comma separated, e.g. "milk,nuts"
);

-- Weekly wellbeing screening. Only the total is stored, not each answer.
CREATE TABLE screenings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  taken_on DATE NOT NULL,
  score TINYINT NOT NULL,            -- 0 to 30
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mother's sleep & recovery tracker (one entry per day)
CREATE TABLE sleep_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  sleep_hours DECIMAL(3,1) NOT NULL,
  energy TINYINT NOT NULL,           -- 1 (exhausted) to 5 (full of energy)
  pain TINYINT NOT NULL,             -- 1 (none) to 5 (severe)
  note VARCHAR(500),
  UNIQUE KEY one_per_day (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Self-care planner: one row for each task ticked on a day
CREATE TABLE selfcare_done (
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  task VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, log_date, task),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hospitals (managed by admin)
CREATE TABLE hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  has_emergency TINYINT(1) NOT NULL DEFAULT 0,
  admin_user_id INT NULL             -- login of this hospital's administrator
);

-- Doctors (managed by admin). Appointments are 30-minute slots between start_time and end_time.
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  speciality VARCHAR(100) NOT NULL,
  qualification VARCHAR(150),
  experience_years INT NOT NULL DEFAULT 0,
  fee INT NOT NULL DEFAULT 0,
  available_days VARCHAR(40) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
  start_time CHAR(5) NOT NULL DEFAULT '10:00',
  end_time CHAR(5) NOT NULL DEFAULT '13:00',
  user_id INT NULL,                  -- the doctor's own login
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- One review per parent per doctor
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,           -- 1 to 5
  comment VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_per_parent (doctor_id, user_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  doctor_id INT NOT NULL,
  child_id INT NULL,                 -- empty when the appointment is for the mother
  appt_date DATE NOT NULL,
  time_slot CHAR(5) NOT NULL,
  status ENUM('booked','completed','cancelled') NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
);

-- Site settings the admin can change (app name, tagline)
CREATE TABLE settings (
  name VARCHAR(50) PRIMARY KEY,
  value MEDIUMTEXT NOT NULL          -- text, or a picture saved as text
);

-- One row per pregnancy. Due date = last period date + 280 days.
CREATE TABLE pregnancies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lmp_date DATE NOT NULL,            -- first day of the last period
  status ENUM('active','completed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Check-up dates the mother sets (scans, doctor visits, tests)
CREATE TABLE checkups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  checkup_date DATE NOT NULL,
  checkup_time CHAR(5) NULL,
  place VARCHAR(150),
  notes VARCHAR(500),
  done TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE kick_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  started_at DATETIME NOT NULL,
  minutes INT NOT NULL,
  kicks INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE contractions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  started_at DATETIME NOT NULL,
  seconds INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Private diary
CREATE TABLE journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entry_date DATE NOT NULL,
  text VARCHAR(2000) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----- Content managed by the admin -----

CREATE TABLE pregnancy_guides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_from INT NOT NULL,
  week_to INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  baby VARCHAR(1000),                -- how the baby is growing
  mother VARCHAR(1000),              -- what the mother may feel
  tips VARCHAR(1000)
);

CREATE TABLE pregnancy_foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trimester TINYINT NOT NULL,        -- 0 = whole pregnancy, 1, 2 or 3
  kind ENUM('eat','avoid') NOT NULL,
  title VARCHAR(150) NOT NULL,
  details VARCHAR(500)
);

CREATE TABLE quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(300) NOT NULL,
  option_a VARCHAR(150) NOT NULL,
  option_b VARCHAR(150) NOT NULL,
  option_c VARCHAR(150) NOT NULL,
  option_d VARCHAR(150) NOT NULL,
  correct ENUM('a','b','c','d') NOT NULL,
  explanation VARCHAR(500)
);

CREATE TABLE affirmations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(300) NOT NULL
);

-- The people who made this site (shown on the Creators page, managed by admin)
CREATE TABLE creators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),                 -- e.g. "Frontend developer"
  photo MEDIUMTEXT,                  -- small picture saved as text (data:image/jpeg;base64,...)
  about VARCHAR(600),
  details VARCHAR(300),              -- e.g. class, register number, college
  email VARCHAR(150),
  phone VARCHAR(30),
  link VARCHAR(250),                 -- LinkedIn, GitHub or portfolio
  sort_order INT NOT NULL DEFAULT 0
);

-- After-birth guide: feeding, care, sleep, development, safety by age in months
CREATE TABLE baby_guides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  month_from INT NOT NULL,
  month_to INT NOT NULL,
  category ENUM('feeding','care','sleep','development','safety') NOT NULL,
  title VARCHAR(150) NOT NULL,
  content VARCHAR(1500) NOT NULL
);

-- Default admin login:  admin@spa.com  /  admin123   (change after first login)
-- Its security answer is "admin". Change both from the Profile page.
INSERT INTO users (name, email, password_hash, security_question, security_answer_hash, role) VALUES
('Admin', 'admin@spa.com', '$2a$10$lZrA7TGaPhWq/xEHydZWbex.FgNHYPOPEVp4mFz0XVlKLbpFrsa5C',
 'What is the default admin answer?', '$2a$10$r8u4xtKVLmswodI6Vcr4ne5mWO/8qPCTsjDkFh.jpAW0p/..kkkFK', 'admin');

-- Starter vaccine list based on India's Universal Immunization Programme.
-- Sample data for the project: check the current official schedule before real use.
INSERT INTO vaccines (name, due_age_weeks, description) VALUES
('BCG', 0, 'At birth - tuberculosis'),
('OPV-0', 0, 'At birth - oral polio'),
('Hepatitis B (birth dose)', 0, 'At birth'),
('OPV-1', 6, '6 weeks - oral polio'),
('Pentavalent-1', 6, '6 weeks - DPT + HepB + Hib'),
('Rotavirus-1', 6, '6 weeks'),
('fIPV-1', 6, '6 weeks - injectable polio'),
('PCV-1', 6, '6 weeks - pneumococcal'),
('OPV-2', 10, '10 weeks'),
('Pentavalent-2', 10, '10 weeks'),
('Rotavirus-2', 10, '10 weeks'),
('OPV-3', 14, '14 weeks'),
('Pentavalent-3', 14, '14 weeks'),
('Rotavirus-3', 14, '14 weeks'),
('fIPV-2', 14, '14 weeks'),
('PCV-2', 14, '14 weeks'),
('MR-1', 39, '9 months - measles & rubella'),
('PCV Booster', 39, '9 months'),
('MR-2', 70, '16-24 months'),
('DPT Booster-1', 70, '16-24 months'),
('OPV Booster', 70, '16-24 months'),
('DPT Booster-2', 260, '5-6 years');

-- Sample meal ideas. General guidance only, not medical advice.
INSERT INTO meal_plans (min_months, max_months, meal_type, title, recipe, allergens) VALUES
(0, 5, 'anytime', 'Breast milk or formula only', 'Babies under 6 months need only breast milk or formula. No water, honey or solid food.', ''),
(6, 8, 'breakfast', 'Ragi porridge', 'Cook 1 tbsp ragi flour in 1 cup water until thick and smooth. Cool and serve.', ''),
(6, 8, 'lunch', 'Mashed rice and dal', 'Pressure cook rice and moong dal until very soft. Mash well with a little ghee.', ''),
(6, 8, 'snack', 'Mashed banana', 'Mash a ripe banana with a fork until smooth.', ''),
(6, 8, 'dinner', 'Steamed carrot puree', 'Steam carrot until soft and blend with a little water.', ''),
(9, 11, 'breakfast', 'Soft idli with ghee', 'Break a soft idli into small pieces and add a few drops of ghee.', ''),
(9, 11, 'lunch', 'Vegetable khichdi', 'Cook rice, dal, carrot and pumpkin together until soft. Mash lightly.', ''),
(9, 11, 'snack', 'Curd with fruit', 'Mix plain curd with mashed mango or banana.', 'milk'),
(9, 11, 'dinner', 'Egg yolk mash', 'Hard boil an egg, mash the yolk with a little warm water or rice.', 'egg'),
(12, 23, 'breakfast', 'Dosa with mild sambar', 'Soft dosa torn into pieces with lightly spiced sambar.', ''),
(12, 23, 'lunch', 'Rice, fish curry and thoran', 'Family food with less spice. Remove all fish bones carefully.', 'fish'),
(12, 23, 'snack', 'Peanut chikki crumbs with milk', 'Crush a small piece of chikki and serve with a cup of milk.', 'nuts,milk'),
(12, 23, 'dinner', 'Chapati with vegetable kurma', 'Soft chapati pieces with mild kurma.', 'wheat'),
(24, 60, 'breakfast', 'Puttu with banana', 'Steamed puttu with ripe banana and a little ghee.', ''),
(24, 60, 'lunch', 'Rice, dal, vegetables and curd', 'A normal family meal with mild spice.', 'milk'),
(24, 60, 'snack', 'Fruit bowl with nuts', 'Seasonal fruit pieces with powdered nuts.', 'nuts'),
(24, 60, 'dinner', 'Egg roast with chapati', 'Mildly spiced egg roast with soft chapati.', 'egg,wheat');

-- DEMO hospitals and doctors (not real). Replace from the admin panel.
INSERT INTO hospitals (name, address, city, phone, latitude, longitude, has_emergency) VALUES
('Demo Mother & Child Hospital', 'Mavoor Road', 'Kozhikode', '0000000001', 11.258800, 75.780400, 1),
('Demo Children''s Clinic', 'MG Road', 'Kochi', '0000000002', 9.931200, 76.267300, 0),
('Demo General Hospital', 'Pattom', 'Thiruvananthapuram', '0000000003', 8.524100, 76.936600, 1);

INSERT INTO doctors (hospital_id, name, speciality, qualification, experience_years, fee, available_days, start_time, end_time) VALUES
(1, 'Dr. Demo Asha', 'Pediatrics', 'MBBS, MD (Pediatrics)', 12, 400, 'Mon,Tue,Wed,Thu,Fri,Sat', '10:00', '13:00'),
(1, 'Dr. Demo Rekha', 'Gynecology', 'MBBS, MS (OBG)', 15, 500, 'Mon,Wed,Fri', '16:00', '19:00'),
(2, 'Dr. Demo Vinod', 'Pediatrics', 'MBBS, DCH', 8, 300, 'Mon,Tue,Wed,Thu,Fri', '09:00', '12:00'),
(3, 'Dr. Demo Fathima', 'Psychiatry', 'MBBS, MD (Psychiatry)', 10, 600, 'Tue,Thu,Sat', '10:00', '12:30'),
(3, 'Dr. Demo Arun', 'Pediatrics', 'MBBS, MD (Pediatrics)', 20, 450, 'Mon,Tue,Wed,Thu,Fri,Sat', '17:00', '20:00');

INSERT INTO settings (name, value) VALUES
('app_name', 'Thaaraattu'),
('tagline', 'Your companion from pregnancy to parenthood'),
('creators_note', 'This site was designed and built by our team as a college project.');

-- Placeholders: replace them from Admin > Creators
INSERT INTO creators (name, role, about, sort_order) VALUES
('Team member 1', 'Role', 'Edit this from the admin panel: add a photo, role and details.', 1),
('Team member 2', 'Role', 'Edit this from the admin panel: add a photo, role and details.', 2),
('Team member 3', 'Role', 'Edit this from the admin panel: add a photo, role and details.', 3),
('Team member 4', 'Role', 'Edit this from the admin panel: add a photo, role and details.', 4);

-- Starter content. General information only, written for this project.
-- Have a doctor review it before real use. The admin can edit everything.
INSERT INTO pregnancy_guides (week_from, week_to, title, baby, mother, tips) VALUES
(1, 4, 'The very beginning', 'Fertilisation happens and the tiny embryo settles into the wall of the womb. It is smaller than a poppy seed.', 'You may not feel different yet. A missed period is often the first sign.', 'Start folic acid if you have not already. Avoid alcohol and smoking. Book your first doctor visit.'),
(5, 8, 'Heart starts beating', 'The heart begins to beat and tiny buds for arms and legs appear. By week 8 the baby is about the size of a raspberry.', 'Nausea, tiredness and tender breasts are common. Mood can change quickly.', 'Eat small meals often. Rest when you can. Ask your doctor before taking any medicine.'),
(9, 12, 'Tiny but complete', 'All main organs have formed. Fingers and toes separate. By week 12 the baby is about the size of a lime.', 'Nausea often starts to ease towards week 12. You may need to pass urine more often.', 'The first scan and blood tests usually happen around now. Drink plenty of water.'),
(13, 16, 'Second trimester begins', 'The baby can make faces and may suck a thumb. Bones are getting harder. Around week 16 the baby is the size of an avocado.', 'Energy usually returns. A small bump may start to show.', 'A good time for gentle exercise such as walking. Include calcium and iron rich foods every day.'),
(17, 20, 'First movements', 'The baby can hear sounds. You may feel the first flutters. Around week 20 the baby is as long as a banana.', 'The bump grows. You may feel backache or stretching pains at the sides of the tummy.', 'The detailed anomaly scan is usually done around week 20. Sleep on your side with a pillow between the knees.'),
(21, 24, 'Growing stronger', 'Movements become stronger and more regular. The baby has sleep and wake times.', 'You may notice swelling in the feet, heartburn or leg cramps.', 'Put your feet up when resting. Eat smaller meals for heartburn. Talk and sing to your baby.'),
(25, 28, 'Eyes open', 'The eyes open and the baby responds to light and sound. The lungs keep developing.', 'Sleep can get harder. Backache is common. A sugar (glucose) test is often done in these weeks.', 'Start noticing your baby''s daily movement pattern. Ask your doctor about the tests due now.'),
(29, 32, 'Third trimester', 'The baby gains weight quickly and practises breathing movements.', 'You may feel breathless and tired again. Practice tightenings (Braxton Hicks) can start.', 'Use the kick counter daily. Plan how you will reach the hospital. Start packing your hospital bag.'),
(33, 36, 'Getting ready', 'Most babies turn head-down. The lungs are nearly mature.', 'Pressure in the pelvis increases. You may pass urine very often.', 'Keep the hospital bag and documents ready. Learn the signs of labour. Rest as much as you can.'),
(37, 40, 'Full term', 'The baby is fully developed and ready to be born any day.', 'You may notice the bump drop lower. Waiting can feel long and tiring.', 'Go to hospital if your waters break, bleeding starts, contractions become regular, or the baby moves less than usual.'),
(41, 42, 'Past the due date', 'Many healthy babies arrive after the due date.', 'It is normal to feel impatient or anxious.', 'Keep counting movements every day and follow your doctor''s plan for extra check-ups.');

INSERT INTO pregnancy_foods (trimester, kind, title, details) VALUES
(0, 'eat', 'Leafy greens and vegetables', 'Spinach, drumstick leaves, beans and carrots give folate, iron and fibre. Wash them well.'),
(0, 'eat', 'Dal, pulses and legumes', 'A daily source of protein and iron: moong, toor, chickpeas, green gram.'),
(0, 'eat', 'Milk, curd and paneer', 'Calcium for the baby''s bones. Choose pasteurised milk.'),
(0, 'eat', 'Well-cooked eggs, fish and lean meat', 'Good protein. Cook fully. Small fish such as sardine and mackerel are good choices.'),
(0, 'eat', 'Fruits', 'Banana, orange, guava, apple and pomegranate. Two or three servings a day.'),
(0, 'eat', 'Whole grains', 'Brown or parboiled rice, wheat, ragi and oats give steady energy and fibre.'),
(0, 'eat', 'Water', 'Aim for 8 to 10 glasses a day. Tender coconut water and buttermilk also help.'),
(1, 'eat', 'Small, frequent meals', 'Helps with nausea. Dry snacks such as toast or rusks in the morning can settle the stomach.'),
(1, 'eat', 'Folate-rich foods', 'Greens, legumes and citrus fruits, along with the folic acid tablet your doctor prescribes.'),
(2, 'eat', 'Iron and calcium foods', 'Ragi, dates, greens, milk and curd. Take iron and calcium tablets as prescribed, at different times of day.'),
(3, 'eat', 'Fibre and fluids', 'Vegetables, fruits and whole grains help prevent constipation. Eat smaller meals if you have heartburn.'),
(0, 'avoid', 'Alcohol and tobacco', 'No amount is known to be safe in pregnancy.'),
(0, 'avoid', 'Raw or undercooked meat, fish and eggs', 'They can carry infections. Cook everything fully.'),
(0, 'avoid', 'Unpasteurised milk and soft cheese made from it', 'Risk of infection. Boil milk before use.'),
(0, 'avoid', 'Unripe papaya', 'Commonly advised to avoid in pregnancy. Ripe papaya in small amounts is usually considered fine; ask your doctor.'),
(0, 'avoid', 'Too much tea and coffee', 'Limit caffeine to about two small cups a day.'),
(0, 'avoid', 'Large predatory fish', 'Shark, swordfish and king mackerel can be high in mercury.'),
(0, 'avoid', 'Unwashed fruit, vegetables and street food', 'Wash produce well and prefer freshly cooked food.');

INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct, explanation) VALUES
('About how long is a full-term pregnancy, counted from the last period?', '30 weeks', '36 weeks', '40 weeks', '46 weeks', 'c', 'Pregnancy is counted as about 40 weeks (280 days) from the first day of the last period.'),
('Which vitamin taken early in pregnancy helps protect the baby''s brain and spine?', 'Folic acid', 'Vitamin C', 'Vitamin K', 'Vitamin E', 'a', 'Folic acid lowers the risk of neural tube defects, so it is advised before and in early pregnancy.'),
('For how long is exclusive breastfeeding recommended?', '1 month', '3 months', '6 months', '12 months', 'c', 'The WHO recommends only breast milk for the first 6 months, then breast milk along with other foods.'),
('When do most babies start solid food?', 'Around 2 months', 'Around 4 months', 'Around 6 months', 'Around 10 months', 'c', 'Around 6 months, when the baby can sit with support and shows interest in food.'),
('Which food should not be given before a baby is 1 year old?', 'Mashed banana', 'Honey', 'Rice porridge', 'Steamed carrot', 'b', 'Honey can cause infant botulism in babies under 12 months.'),
('What is the safest sleeping position for a young baby?', 'On the tummy', 'On the side', 'On the back', 'Sitting up', 'c', 'Babies should be put to sleep on their back on a firm, flat surface.'),
('Which nutrient helps prevent anaemia in pregnancy?', 'Iron', 'Sugar', 'Salt', 'Caffeine', 'a', 'Iron is needed to make extra blood for mother and baby.'),
('How often does a newborn usually feed in 24 hours?', '2 to 3 times', '4 to 5 times', '8 to 12 times', '20 times or more', 'c', 'Newborns have small stomachs and usually feed 8 to 12 times a day.'),
('What should you do if your baby in the womb moves much less than usual?', 'Wait a few days', 'Contact your doctor the same day', 'Drink coffee', 'Ignore it', 'b', 'Reduced movement should always be checked by a doctor without delay.'),
('Which of these helps a newborn feel calm and bond with a parent?', 'Skin-to-skin contact', 'Loud music', 'Bright lights', 'A cold bath', 'a', 'Holding the baby skin-to-skin keeps them warm and calm and supports breastfeeding.');

INSERT INTO affirmations (text) VALUES
('My body knows how to grow and care for my baby.'),
('I am doing my best, and that is enough.'),
('Every day my baby and I grow stronger together.'),
('I deserve rest, care and kindness.'),
('It is okay to ask for help.'),
('I trust myself to learn what my baby needs.'),
('Hard days pass. I can take this one hour at a time.'),
('I am calm, I am safe, and I am loved.'),
('My feelings are valid, whatever they are today.'),
('I am becoming the mother my baby needs.'),
('Small steps still move me forward.'),
('Today I choose to be gentle with myself.');

INSERT INTO baby_guides (month_from, month_to, category, title, content) VALUES
(0, 5, 'feeding', 'Only breast milk or formula', 'For the first 6 months babies need only breast milk (or formula if advised). No water, honey, juice or solid food. Feed whenever the baby shows hunger signs: 8 to 12 times a day for newborns.'),
(0, 5, 'feeding', 'Signs your baby is feeding well', 'Six or more wet nappies a day after the first week, steady weight gain, and a baby who seems content after feeds. Ask your doctor if you are unsure.'),
(6, 8, 'feeding', 'Starting solid food', 'Begin around 6 months with soft, smooth foods: ragi porridge, mashed banana, well-cooked mashed rice and dal, steamed vegetable puree. Start with 2 to 3 spoons once a day and slowly increase. Introduce one new food at a time and wait 3 days. Continue breastfeeding.'),
(9, 11, 'feeding', 'More texture, more variety', 'Offer mashed and soft finger foods 3 times a day plus a snack: soft idli, khichdi, curd, well-cooked egg, soft fruit pieces. Let the baby try to self-feed. Continue breastfeeding.'),
(12, 23, 'feeding', 'Family food', 'Your child can eat most family foods with less spice and salt, 3 meals and 2 snacks a day. Cow''s milk can be given as a drink after 1 year. Avoid whole nuts and hard pieces that can cause choking.'),
(24, 60, 'feeding', 'Healthy eating habits', 'Offer a variety of grains, pulses, vegetables, fruits, milk and eggs or fish. Eat together as a family. Limit sweets, fried snacks and packaged drinks.'),
(0, 2, 'care', 'Cord care and bathing', 'Keep the cord stump clean and dry and let it fall off by itself, usually in 1 to 2 weeks. Give sponge baths until then. See a doctor if the area is red, swollen or smells bad.'),
(0, 5, 'care', 'Holding and soothing', 'Always support the head and neck. Skin-to-skin contact, gentle rocking and a soft voice calm most babies. Crying is how babies communicate; check for hunger, a wet nappy, tiredness or needing a cuddle.'),
(0, 11, 'care', 'Nappy care', 'Change wet or dirty nappies soon. Clean gently from front to back, let the skin dry, and give some nappy-free time each day to prevent rash.'),
(6, 23, 'care', 'Teeth and gums', 'Wipe the gums with a clean soft cloth. Once teeth appear, brush twice a day with a soft baby brush and a tiny smear of toothpaste.'),
(0, 11, 'sleep', 'Safe sleep', 'Put the baby to sleep on the back, on a firm flat mattress, with no pillows, soft toys or loose blankets nearby. Keep the room free of smoke.'),
(0, 5, 'sleep', 'Newborn sleep', 'Newborns sleep 14 to 17 hours a day in short stretches and wake often to feed. This is normal.'),
(6, 23, 'sleep', 'Bedtime routine', 'A simple routine every night helps: bath, feed, a song or story, then lights low. Most babies of this age sleep 12 to 15 hours including naps.'),
(0, 3, 'development', 'First months', 'Your baby looks at faces, startles at sounds and begins to smile at around 6 to 8 weeks. Give a few minutes of supervised tummy time each day while awake.'),
(4, 6, 'development', 'Rolling and babbling', 'Babies begin to roll over, reach for toys, laugh and make sounds. Talk, sing and read to your baby every day.'),
(7, 9, 'development', 'Sitting and exploring', 'Many babies sit without support, start to crawl and respond to their name. Give safe space on the floor to move.'),
(10, 12, 'development', 'Standing and first words', 'Babies pull up to stand, may take first steps and say simple words like "amma". Every child develops at their own pace.'),
(13, 36, 'development', 'Toddler years', 'Walking, running, new words every week and lots of curiosity. Play, picture books and simple conversations help language grow.'),
(0, 11, 'safety', 'When to see a doctor urgently', 'Fever of 38 C or more in a baby under 3 months, trouble breathing, refusing feeds, very few wet nappies, unusual sleepiness, a fit, or yellow skin that is getting worse. Do not wait: go to a doctor.'),
(0, 60, 'safety', 'Everyday safety', 'Never shake a baby. Never leave a baby alone on a bed, in water or in a vehicle. Keep small objects, medicines and hot liquids out of reach.');
