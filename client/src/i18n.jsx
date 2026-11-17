import { createContext, useContext, useState } from 'react';

// Words shown in the menu, headings and main buttons, in English and Malayalam.
// To translate more of the app, add a key here and use t('key') in the page.
const WORDS = {
  home: ['Home', 'ഹോം'],
  pregnancy: ['Pregnancy', 'ഗർഭകാലം'],
  myBaby: ['My Baby', 'എന്റെ കുഞ്ഞ്'],
  babyGuide: ['Baby Guide', 'ശിശു പരിചരണം'],
  wellness: ['Mother Wellness', 'അമ്മയുടെ ആരോഗ്യം'],
  wellnessShort: ['Wellbeing', 'ആരോഗ്യം'],
  baby: ['Baby', 'കുഞ്ഞ്'],
  records: ['Records', 'രേഖകൾ'],
  healthRecord: ['Health Record', 'ആരോഗ്യ രേഖ'],
  videos: ['Videos', 'വീഡിയോകൾ'],
  photos: ['Photos', 'ഫോട്ടോകൾ'],
  iAm: ['I am a', 'ഞാൻ'],
  roleParent: ['Parent', 'രക്ഷിതാവ്'],
  roleDoctor: ['Doctor', 'ഡോക്ടർ'],
  roleHospital: ['Hospital admin', 'ആശുപത്രി അഡ്മിൻ'],
  creators: ['Creators', 'നിർമ്മാതാക്കൾ'],
  features: ['Features', 'സവിശേഷതകൾ'],
  doctorsShort: ['Doctors', 'ഡോക്ടർ'],
  ask: ['Ask', 'ചോദിക്കൂ'],
  careGuide: ['Care guide', 'പരിചരണ ഗൈഡ്'],
  landingText: ['Track your pregnancy week by week, never miss a check-up, keep your mind calm, and care for your baby with confidence.', 'ഗർഭകാലം ആഴ്ച തോറും അറിയാം, പരിശോധനകൾ മറക്കാതിരിക്കാം, മനസ്സ് ശാന്തമാക്കാം, കുഞ്ഞിനെ ആത്മവിശ്വാസത്തോടെ പരിചരിക്കാം.'],
  games: ['Games', 'ഗെയിമുകൾ'],
  doctors: ['Hospitals & Doctors', 'ആശുപത്രികളും ഡോക്ടർമാരും'],
  appointments: ['Appointments', 'അപ്പോയിന്റ്മെന്റുകൾ'],
  assistant: ['AI Assistant', 'AI സഹായി'],
  emergency: ['Emergency', 'അടിയന്തര സഹായം'],
  profile: ['My Profile', 'എന്റെ പ്രൊഫൈൽ'],
  more: ['More', 'കൂടുതൽ'],
  logout: ['Log out', 'ലോഗൗട്ട്'],
  login: ['Log in', 'ലോഗിൻ'],
  register: ['Create account', 'അക്കൗണ്ട് ഉണ്ടാക്കുക'],
  getStarted: ['Get started', 'തുടങ്ങാം'],
  welcomeBack: ['Welcome back', 'വീണ്ടും സ്വാഗതം'],
  loginSub: ['Log in to continue your journey.', 'നിങ്ങളുടെ യാത്ര തുടരാൻ ലോഗിൻ ചെയ്യുക.'],
  registerSub: ['It takes less than a minute.', 'ഒരു മിനിറ്റ് മതി.'],
  email: ['Email', 'ഇമെയിൽ'],
  password: ['Password', 'പാസ്‌വേഡ്'],
  confirmPassword: ['Confirm password', 'പാസ്‌വേഡ് വീണ്ടും നൽകുക'],
  yourName: ['Your name', 'നിങ്ങളുടെ പേര്'],
  forgot: ['Forgot password?', 'പാസ്‌വേഡ് മറന്നോ?'],
  resetPassword: ['Reset password', 'പാസ്‌വേഡ് മാറ്റുക'],
  securityQuestion: ['Security question', 'സുരക്ഷാ ചോദ്യം'],
  securityAnswer: ['Your answer', 'നിങ്ങളുടെ ഉത്തരം'],
  newHere: ['New here?', 'പുതിയ ആളാണോ?'],
  haveAccount: ['Already have an account?', 'അക്കൗണ്ട് ഉണ്ടോ?'],
  hi: ['Hi', 'നമസ്കാരം'],
  reminders: ['Reminders', 'ഓർമ്മപ്പെടുത്തലുകൾ'],
  noReminders: ['Nothing due in the next 14 days.', 'അടുത്ത 14 ദിവസത്തിൽ ഒന്നും ഇല്ല.'],
  todaysThought: ["Today's thought", 'ഇന്നത്തെ ചിന്ത'],
  week: ['Week', 'ആഴ്ച'],
  daysToGo: ['days to go', 'ദിവസം ബാക്കി'],
  dueDate: ['Due date', 'പ്രസവ തീയതി'],
  trimester: ['Trimester', 'ത്രൈമാസം'],
  quickLinks: ['Quick links', 'എളുപ്പവഴികൾ'],
  myChildren: ['My Children', 'എന്റെ കുട്ടികൾ'],
  addChild: ['Add a child', 'കുട്ടിയെ ചേർക്കുക'],
  overview: ['Overview', 'അവലോകനം'],
  food: ['Food Guide', 'ഭക്ഷണം'],
  checkups: ['Check-ups', 'പരിശോധനകൾ'],
  kickCounter: ['Kick Counter', 'കിക്ക് കൗണ്ടർ'],
  contractions: ['Contractions', 'കോൺട്രാക്ഷൻ ടൈമർ'],
  memoryGame: ['Memory Match', 'മെമ്മറി ഗെയിം'],
  bubbleGame: ['Bubble Pop', 'ബബിൾ പോപ്പ്'],
  quiz: ['Quiz', 'ക്വിസ്'],
  journal: ['Journal', 'ഡയറി'],
  startPregnancy: ['Set up pregnancy tracker', 'ഗർഭകാല ട്രാക്കർ തുടങ്ങുക'],
  eat: ['Good to eat', 'കഴിക്കാവുന്നവ'],
  avoid: ['Better to avoid', 'ഒഴിവാക്കേണ്ടവ'],
  save: ['Save', 'സേവ് ചെയ്യുക'],
  feature1: ['Pregnancy tracker', 'ഗർഭകാല ട്രാക്കർ'],
  feature1d: ['Week-by-week guide, due date and what to eat.', 'ആഴ്ച തോറുമുള്ള വിവരങ്ങൾ, പ്രസവ തീയതി, ഭക്ഷണ നിർദ്ദേശങ്ങൾ.'],
  feature2: ['Check-up alerts', 'പരിശോധന ഓർമ്മപ്പെടുത്തൽ'],
  feature2d: ['Set scan and doctor dates and get reminders.', 'സ്കാൻ, ഡോക്ടർ തീയതികൾ സെറ്റ് ചെയ്യൂ, ഓർമ്മപ്പെടുത്തൽ നേടൂ.'],
  feature3: ['Calm mind', 'ശാന്തമായ മനസ്സ്'],
  feature3d: ['Relaxing games, breathing, journal and mood tracking.', 'ഗെയിമുകൾ, ശ്വസന വ്യായാമം, ഡയറി, മൂഡ് ട്രാക്കർ.'],
  feature4: ['Baby care guide', 'ശിശു പരിചരണ ഗൈഡ്'],
  feature4d: ['Feeding by month, sleep, care, growth and vaccines.', 'മാസം തോറുമുള്ള ഭക്ഷണം, ഉറക്കം, വളർച്ച, വാക്സിൻ.'],
  feature5: ['Doctors near you', 'അടുത്തുള്ള ഡോക്ടർമാർ'],
  feature5d: ['Find hospitals, read reviews and book appointments.', 'ആശുപത്രികൾ കണ്ടെത്തൂ, അപ്പോയിന്റ്മെന്റ് ബുക്ക് ചെയ്യൂ.'],
  feature6: ['AI assistant', 'AI സഹായി'],
  feature6d: ['Ask questions any time, in English or Malayalam.', 'ഏത് സമയത്തും ചോദ്യങ്ങൾ ചോദിക്കാം.'],
};

const LangContext = createContext(null);
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'en');
  const setLang = (value) => { localStorage.setItem('lang', value); setLangState(value); };
  // t('home') -> 'Home' or 'ഹോം'. Unknown keys are shown as they are.
  const t = (key) => (WORDS[key] ? WORDS[key][lang === 'ml' ? 1 : 0] : key);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

// Small EN / മല switch
export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button type="button" className={lang === 'ml' ? 'on' : ''} onClick={() => setLang('ml')}>മല</button>
    </div>
  );
}
