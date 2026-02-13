/* ============================================================
   DevEdu India — Ultimate JavaScript Engine
   XP System, AI Chat, Drawing, Coding, Music, Math Tools,
   Gamification, Dark Mode, 12 Languages, Accessibility, & More
   ============================================================ */

// ──── GLOBAL STATE ────
const state = {
  language: "en",
  voices: [],
  preferredVoice: null,
  quizIndex: 0,
  quizScore: 0,
  ageGroup: "8-12",
  profile: "Aarav",
  theme: "light",
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  achievements: [],
  chatHistory: [],
};

const LANGUAGES = {
  en: "English", hi: "हिंदी", ta: "தமிழ்", te: "తెలుగు", bn: "বাংলা",
  mr: "मराठी", gu: "ગુજરાતી", kn: "ಕನ್ನಡ", ml: "മലയാളം", pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ", as: "অসমীয়া"
};

const defaultProfiles = ["Aarav", "Anaya", "Vihaan"];
const profileDefaults = {
  Aarav: { ageGroup: "8-12", progress: { math: 78, science: 64, languages: 72 }, values: { empathy: 82, responsibility: 69, safety: 75 }, profile: { nickname: "Aarav", goal: "Master fractions", favorite: "Space", style: "Visual" } },
  Anaya: { ageGroup: "3-7", progress: { math: 45, science: 40, languages: 55 }, values: { empathy: 60, responsibility: 52, safety: 48 }, profile: { nickname: "Anaya", goal: "Read 5 new words", favorite: "Animals", style: "Play" } },
  Vihaan: { ageGroup: "13-18", progress: { math: 70, science: 73, languages: 66 }, values: { empathy: 74, responsibility: 71, safety: 78 }, profile: { nickname: "Vihaan", goal: "Ace civics", favorite: "Technology", style: "Debate" } },
};

// ──── XP & LEVEL SYSTEM ────
const XP_PER_LEVEL = 100;
const XP_REWARDS = { quiz_correct: 15, lesson_done: 30, game_done: 20, kindness: 25, daily_login: 10, streak_bonus: 5, coding_run: 10, drawing_save: 10, story_read: 15 };

function getXPData() {
  const d = localStorage.getItem(`devedu_xp_${state.profile}`);
  try { return d ? JSON.parse(d) : { xp: 0, level: 1, streak: 0, lastDate: null, achievements: [] }; } catch { return { xp: 0, level: 1, streak: 0, lastDate: null, achievements: [] }; }
}
function saveXPData(data) { localStorage.setItem(`devedu_xp_${state.profile}`, JSON.stringify(data)); }

function awardXP(amount, reason) {
  const data = getXPData();
  data.xp += amount;
  while (data.xp >= data.level * XP_PER_LEVEL) { data.xp -= data.level * XP_PER_LEVEL; data.level++; showConfetti(); showToast(`🎉 Level Up! Level ${data.level}`, 'xp'); }
  saveXPData(data);
  state.xp = data.xp; state.level = data.level;
  updateXPBar();
  if (reason) showToast(`+${amount} XP: ${reason}`, 'xp');
}

function updateXPBar() {
  const data = getXPData();
  const bar = document.querySelector('.xp-fill');
  const lvl = document.querySelector('.xp-level');
  const txt = document.querySelector('.xp-text');
  if (bar) bar.style.width = `${(data.xp / (data.level * XP_PER_LEVEL)) * 100}%`;
  if (lvl) lvl.textContent = data.level;
  if (txt) txt.textContent = `${data.xp}/${data.level * XP_PER_LEVEL} XP`;
}

function checkStreak() {
  const data = getXPData();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (data.lastDate === today) return;
  if (data.lastDate === yesterday) { data.streak++; awardXP(XP_REWARDS.streak_bonus * data.streak, `${data.streak}-day streak!`); }
  else if (data.lastDate !== today) { data.streak = 1; }
  data.lastDate = today;
  awardXP(XP_REWARDS.daily_login, 'Daily login');
  saveXPData(data);
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const data = getXPData();
  document.querySelectorAll('.streak-count').forEach(el => el.textContent = data.streak);
}

// ──── ACHIEVEMENTS ────
const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '📖', label: 'First Lesson', condition: () => Object.keys(loadProgress()).some(k => loadProgress()[k]) },
  { id: 'quiz_master', icon: '🧠', label: 'Quiz Master', condition: () => getXPData().xp > 100 },
  { id: 'streak_3', icon: '🔥', label: '3-Day Streak', condition: () => getXPData().streak >= 3 },
  { id: 'streak_7', icon: '⚡', label: '7-Day Streak', condition: () => getXPData().streak >= 7 },
  { id: 'level_5', icon: '⭐', label: 'Level 5', condition: () => getXPData().level >= 5 },
  { id: 'coder', icon: '💻', label: 'Young Coder', condition: () => localStorage.getItem('devedu_code_run') === 'true' },
  { id: 'artist', icon: '🎨', label: 'Artist', condition: () => localStorage.getItem('devedu_drawing_saved') === 'true' },
  { id: 'musician', icon: '🎵', label: 'Musician', condition: () => localStorage.getItem('devedu_music_played') === 'true' },
  { id: 'reader', icon: '📚', label: 'Bookworm', condition: () => parseInt(localStorage.getItem('devedu_stories_read') || '0') >= 3 },
  { id: 'helper', icon: '🤝', label: 'Kind Helper', condition: () => localStorage.getItem(`devedu_kindness_${state.profile}`) },
  { id: 'explorer', icon: '🗺️', label: 'Explorer', condition: () => parseInt(localStorage.getItem('devedu_pages_visited') || '0') >= 5 },
  { id: 'scientist', icon: '🔬', label: 'Scientist', condition: () => loadProgress()['lesson-living'] },
];

function checkAchievements() {
  const data = getXPData();
  let newOnes = false;
  ACHIEVEMENTS.forEach(a => {
    if (!data.achievements.includes(a.id) && a.condition()) {
      data.achievements.push(a.id);
      newOnes = true;
      showToast(`🏆 Achievement: ${a.label}!`, 'xp');
    }
  });
  if (newOnes) saveXPData(data);
  renderAchievements();
}

function renderAchievements() {
  const data = getXPData();
  document.querySelectorAll('.achievement-grid').forEach(grid => {
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const div = document.createElement('div');
      div.className = `achievement ${data.achievements.includes(a.id) ? '' : 'locked'}`;
      div.innerHTML = `<div class="achievement-icon">${a.icon}</div><div class="achievement-label">${a.label}</div>`;
      grid.appendChild(div);
    });
  });
}

// ──── PROFILE & STATE ────
function getProfileData() {
  const s = localStorage.getItem(`devedu_profile_${state.profile}`);
  try { return s ? JSON.parse(s) : profileDefaults[state.profile] || profileDefaults.Aarav; } catch { return profileDefaults[state.profile] || profileDefaults.Aarav; }
}
function saveProfileData(data) { localStorage.setItem(`devedu_profile_${state.profile}`, JSON.stringify(data)); }
function loadProgress() { try { return JSON.parse(localStorage.getItem(`devedu_progress_${state.profile}`) || '{}'); } catch { return {}; } }
function saveProgress(p) { localStorage.setItem(`devedu_progress_${state.profile}`, JSON.stringify(p)); }
function saveState() { localStorage.setItem('devedu_state', JSON.stringify({ language: state.language, ageGroup: state.ageGroup, profile: state.profile, quizIndex: state.quizIndex, quizScore: state.quizScore, theme: state.theme })); }
function loadState() {
  try {
    const p = JSON.parse(localStorage.getItem('devedu_state') || '{}');
    if (p.language) state.language = p.language;
    if (p.ageGroup) state.ageGroup = p.ageGroup;
    if (p.profile) state.profile = p.profile;
    if (typeof p.quizIndex === 'number') state.quizIndex = p.quizIndex;
    if (typeof p.quizScore === 'number') state.quizScore = p.quizScore;
    if (p.theme) state.theme = p.theme;
  } catch {}
}
function getProfiles() { try { const p = JSON.parse(localStorage.getItem('devedu_profiles') || 'null'); return Array.isArray(p) && p.length ? p : [...defaultProfiles]; } catch { return [...defaultProfiles]; } }
function saveProfiles(p) { localStorage.setItem('devedu_profiles', JSON.stringify(p)); }

// ──── THEME ────
function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveState();
  document.querySelectorAll('[data-theme-toggle]').forEach(el => {
    el.textContent = theme === 'dark' ? '☀️' : '🌙';
  });
}

// ──── LANGUAGE ────
function setLanguage(lang) {
  state.language = lang;
  document.documentElement.setAttribute('lang', lang);
  document.querySelectorAll('.i18n').forEach(el => {
    const text = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
    if (text) el.textContent = text;
  });
  document.querySelectorAll('[data-lang]').forEach(btn => btn.classList.toggle('secondary', btn.dataset.lang !== lang));
  renderQuiz(); renderPersonalAI(); syncLessonLocks(loadProgress()); renderResourceLists(); renderBookLists(); updateTutorMessage();
  saveState();
}

// ──── QUIZ SYSTEM ────
const quizQuestions = [
  { en:"Why should we save water?", hi:"हमें पानी क्यों बचाना चाहिए?", options:{ en:["Because it is unlimited","Because many people need it","Because it is noisy"], hi:["क्योंकि यह अनंत है","क्योंकि कई लोगों को इसकी जरूरत है","क्योंकि यह तेज आवाज करता है"] }, answerIndex:1, ageGroup:"8-12" },
  { en:"What is a good way to show respect?", hi:"सम्मान दिखाने का अच्छा तरीका क्या है?", options:{ en:["Listen when others speak","Interrupt every time","Ignore everybody"], hi:["जब कोई बोले तो सुनना","हर बार बीच में बोलना","सबको नजरअंदाज करना"] }, answerIndex:0, ageGroup:"3-7" },
  { en:"Which skill helps you learn faster?", hi:"कौन सा कौशल तेजी से सीखने में मदद करता है?", options:{ en:["Curiosity","Being careless","Skipping practice"], hi:["जिज्ञासा","लापरवाही","अभ्यास छोड़ना"] }, answerIndex:0, ageGroup:"13-18" },
  { en:"If you find a lost pencil, what should you do?", hi:"खोई हुई पेंसिल मिले तो क्या करें?", options:{ en:["Keep it","Return it or tell a teacher","Throw it away"], hi:["रख लें","लौटा दें या शिक्षक को बताएं","फेंक दें"] }, answerIndex:1, ageGroup:"3-7" },
  { en:"Which number is bigger?", hi:"कौन सी संख्या बड़ी है?", options:{ en:["9","6","3"], hi:["9","6","3"] }, answerIndex:0, ageGroup:"3-7" },
  { en:"Why separate wet and dry waste?", hi:"गीला और सूखा कचरा अलग क्यों करते हैं?", options:{ en:["For fun","To recycle properly","To make it heavier"], hi:["मज़े के लिए","सही रीसायकल के लिए","भारी बनाने के लिए"] }, answerIndex:1, ageGroup:"8-12" },
  { en:"What helps a plant grow?", hi:"पौधे को बढ़ने में क्या मदद करता है?", options:{ en:["Sunlight and water","Only noise","Only toys"], hi:["धूप और पानी","सिर्फ शोर","सिर्फ खिलौने"] }, answerIndex:0, ageGroup:"8-12" },
  { en:"Which is a safe online habit?", hi:"कौन सी ऑनलाइन आदत सुरक्षित है?", options:{ en:["Share passwords","Use strong passwords","Click any link"], hi:["पासवर्ड साझा करना","मजबूत पासवर्ड","हर लिंक पर क्लिक"] }, answerIndex:1, ageGroup:"13-18" },
  { en:"Why is the Constitution important?", hi:"संविधान महत्वपूर्ण क्यों है?", options:{ en:["It sets rules and rights","It is a movie","It is a game"], hi:["यह नियम और अधिकार तय करता है","यह फिल्म है","यह खेल है"] }, answerIndex:0, ageGroup:"13-18" },
  { en:"What is 7 × 8?", hi:"7 × 8 = ?", options:{ en:["54","56","58"], hi:["54","56","58"] }, answerIndex:1, ageGroup:"8-12" },
  { en:"What color do you get mixing blue + yellow?", hi:"नीला + पीला मिलाने से कौन सा रंग बनता है?", options:{ en:["Green","Red","Orange"], hi:["हरा","लाल","नारंगी"] }, answerIndex:0, ageGroup:"3-7" },
  { en:"Capital of India?", hi:"भारत की राजधानी?", options:{ en:["Mumbai","New Delhi","Kolkata"], hi:["मुंबई","नई दिल्ली","कोलकाता"] }, answerIndex:1, ageGroup:"8-12" },
  { en:"Who wrote the Indian National Anthem?", hi:"भारतीय राष्ट्रगान किसने लिखा?", options:{ en:["Mahatma Gandhi","Rabindranath Tagore","Jawaharlal Nehru"], hi:["महात्मा गांधी","रवींद्रनाथ टैगोर","जवाहरलाल नेहरू"] }, answerIndex:1, ageGroup:"13-18" },
  { en:"How many legs does a spider have?", hi:"मकड़ी के कितने पैर होते हैं?", options:{ en:["6","8","10"], hi:["6","8","10"] }, answerIndex:1, ageGroup:"3-7" },
  { en:"Water boils at what temperature?", hi:"पानी किस तापमान पर उबलता है?", options:{ en:["50°C","100°C","200°C"], hi:["50°C","100°C","200°C"] }, answerIndex:1, ageGroup:"8-12" },
];

function getQuizPool() { const p = quizQuestions.filter(q => q.ageGroup === state.ageGroup); return p.length ? p : quizQuestions; }

function renderQuiz() {
  const el = document.getElementById('quiz');
  if (!el) return;
  const pool = getQuizPool();
  const q = pool[state.quizIndex % pool.length];
  const lang = state.language === 'hi' ? 'hi' : 'en';
  const qText = el.querySelector('.quiz-question');
  if (qText) qText.textContent = q[lang] || q.en;
  const opts = el.querySelector('.quiz-options');
  if (opts) {
    opts.innerHTML = '';
    (q.options[lang] || q.options.en).forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleQuizAnswer(btn, i));
      opts.appendChild(btn);
    });
  }
  const progress = el.querySelector('.progress span');
  if (progress) progress.style.width = `${(state.quizIndex / pool.length) * 100}%`;
  const score = el.querySelector('.quiz-score');
  if (score) score.textContent = `${state.quizScore} / ${pool.length}`;
}

function handleQuizAnswer(button, index) {
  const pool = getQuizPool();
  const q = pool[state.quizIndex % pool.length];
  const correct = index === q.answerIndex;
  button.classList.add(correct ? 'correct' : 'wrong');
  if (correct) { state.quizScore++; awardXP(XP_REWARDS.quiz_correct, 'Correct answer!'); }
  saveState();
  setTimeout(() => { state.quizIndex = (state.quizIndex + 1) % pool.length; renderQuiz(); }, 900);
}

// ──── LESSON SYSTEM ────
const lessonPrereqs = { "lesson-shapes":[], "lesson-fractions":["lesson-shapes"], "lesson-hindi-reading":["lesson-shapes"], "lesson-living":["lesson-shapes"], "lesson-algebra":["lesson-fractions"], "lesson-constitution":["lesson-algebra"], "lesson-economy":["lesson-constitution"] };
const lessonLabels = { "lesson-shapes":{en:"Foundations - Shapes",hi:"बुनियाद - आकार"}, "lesson-fractions":{en:"Math - Fractions",hi:"गणित - भिन्न"}, "lesson-hindi-reading":{en:"Languages - Hindi",hi:"भाषा - हिंदी"}, "lesson-living":{en:"Science - Biology",hi:"विज्ञान - जीवविज्ञान"}, "lesson-algebra":{en:"Math - Algebra",hi:"गणित - बीजगणित"}, "lesson-constitution":{en:"Civics - Constitution",hi:"नागरिक शास्त्र - संविधान"}, "lesson-economy":{en:"Economics - Basics",hi:"अर्थशास्त्र - बुनियाद"} };
const recommendedLessonVideos = { "lesson-shapes":"https://www.youtube.com/results?search_query=shapes+for+kids", "lesson-fractions":"https://www.youtube.com/results?search_query=fractions+for+kids", "lesson-hindi-reading":"https://www.youtube.com/results?search_query=hindi+reading+for+kids", "lesson-living":"https://www.youtube.com/results?search_query=living+and+non+living+things+for+kids", "lesson-algebra":"https://www.youtube.com/results?search_query=algebra+basics+for+kids", "lesson-constitution":"https://www.youtube.com/results?search_query=indian+constitution+basics+for+students", "lesson-economy":"https://www.youtube.com/results?search_query=basic+economics+for+students" };

function isLessonUnlocked(id, progress) { return (lessonPrereqs[id] || []).every(r => progress[r]); }
function getLessonLabel(id) { const e = lessonLabels[id]; return e ? (state.language === 'hi' ? e.hi : e.en) : id; }

function syncLessonLocks(progress) {
  document.querySelectorAll('[data-lesson-id]').forEach(card => {
    const id = card.dataset.lessonId;
    const unlocked = isLessonUnlocked(id, progress);
    card.classList.toggle('locked', !unlocked);
    const btn = card.querySelector('[data-start-lesson]');
    if (btn) {
      btn.setAttribute('aria-disabled', String(!unlocked));
      btn.dataset.locked = String(!unlocked);
      const lk = unlocked ? 'data-label-unlocked' : 'data-label-locked';
      const lang = state.language === 'hi' ? `${lk}-hi` : `${lk}-en`;
      btn.textContent = btn.getAttribute(lang) || btn.getAttribute(lk) || (unlocked ? 'Start' : 'Locked');
    }
  });
}

function showLessonPlayer(card) {
  const player = document.getElementById('lessonPlayer');
  if (!player) return;
  const title = card.querySelector('h3'); const desc = card.querySelector('p');
  const pt = document.getElementById('lessonPlayerTitle'); const pd = document.getElementById('lessonPlayerDesc');
  if (pt && title) pt.textContent = title.textContent;
  if (pd && desc) pd.textContent = desc.textContent;
  player.classList.remove('hidden');
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ──── RESOURCE CATALOGS ────
const resourceCatalog = {
  "videos-6-8": [
    { label:{en:"Fractions (Khan Academy)",hi:"भिन्न (खान अकादमी)"}, desc:{en:"Grade 6-7 fundamentals.",hi:"कक्षा 6-7 बुनियाद।"}, url:"https://www.khanacademy.org/search?page_search_query=fractions" },
    { label:{en:"Cells & Life (TED-Ed)",hi:"कोशिकाएं और जीवन (TED-Ed)"}, desc:{en:"Short concept explainers.",hi:"छोटे कॉन्सेप्ट एक्सप्लेनर।"}, url:"https://ed.ted.com/search?utf8=%E2%9C%93&q=cells" },
    { label:{en:"Clean Water (NCERT)",hi:"स्वच्छ पानी (NCERT)"}, desc:{en:"Government videos by topic.",hi:"विषय अनुसार सरकारी वीडियो।"}, url:"https://www.youtube.com/results?search_query=NCERT+class+6+water" },
  ],
  "videos-9-10": [
    { label:{en:"Algebra Basics",hi:"बीजगणित बुनियाद"}, desc:{en:"Linear equations.",hi:"रेखीय समीकरण।"}, url:"https://www.khanacademy.org/search?page_search_query=linear+equations" },
    { label:{en:"Physics Basics",hi:"फिजिक्स बुनियाद"}, desc:{en:"Quick science primers.",hi:"तेज़ विज्ञान परिचय।"}, url:"https://thecrashcourse.com/?s=physics" },
  ],
  "videos-11-12": [
    { label:{en:"Economics Basics",hi:"अर्थशास्त्र बुनियाद"}, desc:{en:"Micro and macro foundations.",hi:"माइक्रो और मैक्रो बुनियाद।"}, url:"https://www.khanacademy.org/search?page_search_query=economics" },
  ],
  "games-3-7": [{ label:{en:"Story Builder Guide",hi:"स्टोरी बिल्डर गाइड"}, desc:{en:"Create endings and values.",hi:"कहानी के अंत और मूल्य।"}, url:"https://www.khanacademy.org/" }],
  "games-8-12": [{ label:{en:"Science Detective Tips",hi:"साइंस डिटेक्टिव टिप्स"}, desc:{en:"Observation and experiments.",hi:"ऑब्ज़र्वेशन और प्रयोग।"}, url:"https://www.youtube.com/results?search_query=NCERT+science+class+6+experiment" }],
  "games-13-18": [{ label:{en:"Civic Hero Missions",hi:"सिविक हीरो मिशन"}, desc:{en:"Community challenges.",hi:"समुदाय चुनौतियां।"}, url:"https://www.youtube.com/results?search_query=NCERT+civics+class+10" }],
  "parent-guides": [{ label:{en:"NCERT Official",hi:"NCERT आधिकारिक"}, desc:{en:"Syllabus resources.",hi:"सिलेबस संसाधन।"}, url:"https://ncert.nic.in/" }],
  "daily-routine": [{ label:{en:"Focus Sprints",hi:"फोकस स्प्रिंट"}, desc:{en:"Time-boxed study tips.",hi:"टाइम-बॉक्स पढ़ाई।"}, url:"https://www.khanacademy.org/" }],
  "life-skills": [{ label:{en:"Empathy & Kindness (TED-Ed)",hi:"सहानुभूति और दया"}, desc:{en:"Values and behavior.",hi:"मूल्य और व्यवहार।"}, url:"https://ed.ted.com/search?utf8=%E2%9C%93&q=empathy" }],
  "auth-support": [{ label:{en:"Help Center",hi:"हेल्प सेंटर"}, desc:{en:"FAQs and guidance.",hi:"सवाल और मार्गदर्शन।"}, url:"https://ncert.nic.in/" }],
};
const bookCatalog = {
  "books-6-8": [{ label:{en:"Classic Science Stories",hi:"क्लासिक साइंस कहानियां"}, desc:{en:"Public-domain reads.",hi:"पब्लिक-डोमेन रीड्स।"}, url:"https://www.gutenberg.org/ebooks/search/?query=science+for+children" }],
  "books-9-10": [{ label:{en:"Literature Classics",hi:"साहित्य क्लासिक्स"}, desc:{en:"Public-domain novels.",hi:"पब्लिक-डोमेन उपन्यास।"}, url:"https://www.gutenberg.org/ebooks/search/?query=young+adult+classic" }],
  "books-11-12": [{ label:{en:"Economics & Society",hi:"अर्थशास्त्र और समाज"}, desc:{en:"Policy and society reads.",hi:"नीति और समाज।"}, url:"https://www.gutenberg.org/ebooks/search/?query=economics" }],
};

function createResourceCard(item) {
  const card = document.createElement('div'); card.className = 'resource-card';
  const l = state.language === 'hi' ? (item.label.hi||item.label.en) : item.label.en;
  const d = state.language === 'hi' ? (item.desc.hi||item.desc.en) : item.desc.en;
  card.innerHTML = `<h3>${l}</h3><p>${d}</p><a class="button secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">Open</a>`;
  return card;
}
function renderResourceLists() { document.querySelectorAll('[data-resource-list]').forEach(el => { const items = resourceCatalog[el.dataset.resourceList]||[]; el.innerHTML=''; items.forEach(i=>el.appendChild(createResourceCard(i))); }); }
function renderBookLists() { document.querySelectorAll('[data-book-list]').forEach(el => { const items = bookCatalog[el.dataset.bookList]||[]; el.innerHTML=''; items.forEach(i=>el.appendChild(createResourceCard(i))); }); }

// ──── VOICE / TTS ────
function loadVoices() { state.voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; state.preferredVoice = state.voices.find(v=>v.lang==='hi-IN') || state.voices.find(v=>v.lang==='en-IN') || state.voices.find(v=>v.lang.startsWith(state.language==='hi'?'hi':'en')) || state.voices[0] || null; }
function speakText(text) { if(!window.speechSynthesis||!text) return; const u=new SpeechSynthesisUtterance(text); if(state.preferredVoice) u.voice=state.preferredVoice; u.rate=0.95; u.pitch=1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }

// ──── PROFILE UI ────
function renderProfileOptions() {
  const profiles = getProfiles();
  document.querySelectorAll('[data-profile-select]').forEach(select => {
    const cur = select.value || state.profile; select.innerHTML = '';
    profiles.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; select.appendChild(o); });
    select.value = profiles.includes(cur) ? cur : profiles[0];
  });
  if (!profiles.includes(state.profile)) state.profile = profiles[0];
}

function renderPersonalAI() {
  const pd = getProfileData(); if(!pd) return;
  const p = pd.profile;
  const g = state.language==='hi' ? `नमस्ते ${p.nickname}! आज हम ${p.goal} पर फोकस करेंगे।` : `Hi ${p.nickname}! Today we'll focus on ${p.goal}.`;
  const e = state.language==='hi' ? `आपको ${p.favorite} पसंद है, तो आज उससे जुड़े उदाहरण लाए हैं।` : `You love ${p.favorite}, so I brought examples related to it.`;
  const s = state.language==='hi' ? `सीखने की शैली: ${p.style}.` : `Learning style: ${p.style}.`;
  document.querySelectorAll("[data-personal='greeting']").forEach(el=>el.textContent=g);
  document.querySelectorAll("[data-personal='encouragement']").forEach(el=>el.textContent=e);
  document.querySelectorAll("[data-personal='style']").forEach(el=>el.textContent=s);
}

function setAgeGroup(ag) {
  state.ageGroup = ag;
  document.body.classList.toggle('age-young', ag==='3-7');
  document.querySelectorAll('[data-age]').forEach(b=>b.classList.toggle('secondary',b.dataset.age!==ag));
  state.quizIndex=0; state.quizScore=0;
  renderQuiz(); filterAgeGroupElements(); saveState();
}

function filterAgeGroupElements() { document.querySelectorAll('[data-age-group]').forEach(el=>el.classList.toggle('age-hidden',!matchesAgeGroup(el.dataset.ageGroup,state.ageGroup))); }
function matchesAgeGroup(v,t) { if(!v||v==='all') return true; return v.split(',').map(s=>s.trim()).includes(t); }
function filterLessons() { const a=document.getElementById('ageFilter'),b=document.getElementById('boardFilter'),s=document.getElementById('lessonSearch'); if(!a||!b||!s) return; document.querySelectorAll('.lesson-card').forEach(c=>{const ma=a.value==='all'||c.dataset.age===a.value,mb=b.value==='all'||c.dataset.board===b.value,mt=c.textContent.toLowerCase().includes(s.value.toLowerCase()),mg=matchesAgeGroup(c.dataset.ageGroup,state.ageGroup);c.style.display=ma&&mb&&mt&&mg?'flex':'none';}); }

function syncProfileUI() {
  document.querySelectorAll('[data-profile-select]').forEach(s=>s.value=state.profile);
  const pd = getProfileData();
  if(pd&&pd.ageGroup) setAgeGroup(pd.ageGroup);
  updateDashboardBars(); syncProfileForm(); renderPersonalAI(); syncProgressUI(); updateXPBar(); updateStreakDisplay(); checkAchievements();
}

function syncProfileForm() { const pd=getProfileData(); if(!pd) return; document.querySelectorAll('[data-profile-field]').forEach(i=>{const k=i.dataset.profileField; if(pd.profile&&pd.profile[k]) i.value=pd.profile[k];}); }

function updateDashboardBars() {
  const pd = getProfileData(); if(!pd) return;
  [{key:'math',s:'[data-metric="math"]'},{key:'science',s:'[data-metric="science"]'},{key:'languages',s:'[data-metric="languages"]'},{key:'empathy',s:'[data-metric="empathy"]'},{key:'responsibility',s:'[data-metric="responsibility"]'},{key:'safety',s:'[data-metric="safety"]'}].forEach(item=>{
    const v = (pd.progress && pd.progress[item.key]) ?? (pd.values && pd.values[item.key]) ?? 0;
    const bar = document.querySelector(`${item.s} span`);
    const label = document.querySelector(`[data-metric-label="${item.key}"] .metric-value`);
    if(bar) bar.style.width=`${v}%`;
    if(label) label.textContent=`${v}%`;
  });
}

function syncProgressUI() {
  const p = loadProgress();
  document.querySelectorAll('[data-progress-item]').forEach(el=>{el.classList.toggle('completed',!!p[el.dataset.progressItem]);});
  syncLessonLocks(p);
}

// ──── AI CHAT ────
const AI_RESPONSES = {
  greetings: [
    {en:"Hello! I'm Guru, your AI learning buddy! How can I help you today? 🎓",hi:"नमस्ते! मैं गुरु हूं, आपका AI सीखने वाला साथी! आज कैसे मदद करूं? 🎓"},
    {en:"Hi there! Ready to learn something amazing today? 🌟",hi:"नमस्ते! आज कुछ अद्भुत सीखने को तैयार हैं? 🌟"},
  ],
  math: [
    {en:"Great question about math! Remember: practice makes perfect. Try breaking the problem into smaller steps. Would you like me to explain a concept?",hi:"गणित का बढ़िया सवाल! याद रखें: अभ्यास से सब होता है। समस्या को छोटे हिस्सों में बांटें।"},
    {en:"Math tip: Draw pictures or use objects to visualize numbers. It makes everything clearer! 📐",hi:"गणित टिप: संख्याओं को समझने के लिए चित्र बनाएं। सब साफ हो जाएगा! 📐"},
  ],
  science: [
    {en:"Science is all about asking 'why' and 'how'! What are you curious about? 🔬",hi:"विज्ञान का मतलब है 'क्यों' और 'कैसे' पूछना! आप किस बारे में जिज्ञासु हैं? 🔬"},
    {en:"Fun fact: Your body has about 37.2 trillion cells! Science is incredible. What topic shall we explore?",hi:"रोचक तथ्य: आपके शरीर में लगभग 37.2 ट्रिलियन कोशिकाएं हैं! विज्ञान अद्भुत है।"},
  ],
  motivation: [
    {en:"You're doing amazing! Every small step counts. Keep going! 💪",hi:"आप शानदार कर रहे हैं! हर छोटा कदम मायने रखता है। आगे बढ़ते रहें! 💪"},
    {en:"Remember: even the greatest scientists started by being curious. You're on the right track! 🚀",hi:"याद रखें: सबसे बड़े वैज्ञानिक भी जिज्ञासा से शुरू हुए। आप सही रास्ते पर हैं! 🚀"},
  ],
  help: [
    {en:"I can help with: 📚 Subjects (Math, Science, English, Hindi) | 🎮 Games & Quizzes | 🎨 Creative activities | 💡 Study tips | 🧘 Wellbeing",hi:"मैं मदद कर सकता हूं: 📚 विषय (गणित, विज्ञान) | 🎮 खेल | 🎨 क्रिएटिव | 💡 पढ़ाई टिप्स | 🧘 वेलबीइंग"},
  ],
  default: [
    {en:"That's interesting! Let me think about that. Meanwhile, try exploring our lessons or play a quiz! 🎯",hi:"दिलचस्प है! इस बीच, हमारे लेसन देखें या क्विज़ खेलें! 🎯"},
    {en:"I'm always learning too! Shall we explore math, science, stories, or something creative? ✨",hi:"मैं भी हमेशा सीख रहा हूं! गणित, विज्ञान, कहानियां, या कुछ क्रिएटिव? ✨"},
  ]
};

function getAIResponse(msg) {
  const m = msg.toLowerCase();
  const lang = state.language === 'hi' ? 'hi' : 'en';
  let pool = AI_RESPONSES.default;
  if (/hello|hi|hey|namaste|नमस्ते/.test(m)) pool = AI_RESPONSES.greetings;
  else if (/math|gaNit|गणित|number|fraction|algebra/.test(m)) pool = AI_RESPONSES.math;
  else if (/science|विज्ञान|physics|chemistry|biology/.test(m)) pool = AI_RESPONSES.science;
  else if (/help|मदद|what can|kya kar/.test(m)) pool = AI_RESPONSES.help;
  else if (/motivat|inspire|tired|bore|उबा|थक/.test(m)) pool = AI_RESPONSES.motivation;
  return pool[Math.floor(Math.random()*pool.length)][lang];
}

function initAIChat() {
  const toggle = document.querySelector('.ai-chat-toggle');
  const chat = document.querySelector('.ai-chat');
  if (!toggle || !chat) return;

  toggle.addEventListener('click', () => { chat.classList.toggle('hidden'); if(!chat.classList.contains('hidden')) chat.querySelector('input')?.focus(); });
  chat.querySelector('.ai-chat-close')?.addEventListener('click', () => chat.classList.add('hidden'));

  const input = chat.querySelector('.ai-chat-input input');
  const send = chat.querySelector('.ai-chat-input button');
  const msgs = chat.querySelector('.ai-chat-messages');

  function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = `ai-msg ${type}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    input.value = '';
    setTimeout(() => {
      addMsg(getAIResponse(text), 'bot');
    }, 500 + Math.random()*500);
  }

  send?.addEventListener('click', handleSend);
  input?.addEventListener('keydown', e => { if(e.key === 'Enter') handleSend(); });

  // Welcome message
  const lang = state.language === 'hi' ? 'hi' : 'en';
  addMsg(AI_RESPONSES.greetings[0][lang], 'bot');
}

// ──── DRAWING CANVAS ────
function initDrawingCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth; canvas.height = 400;
  let drawing = false, lastX=0, lastY=0;
  const color = document.getElementById('drawColor');
  const size = document.getElementById('drawSize');

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return [t.clientX - r.left, t.clientY - r.top];
  }

  function startDraw(e) { e.preventDefault(); drawing=true; [lastX,lastY]=getPos(e); }
  function draw(e) {
    if(!drawing) return; e.preventDefault();
    const [x,y] = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y);
    ctx.strokeStyle = color?.value || '#000'; ctx.lineWidth = size?.value || 3; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.stroke(); lastX=x; lastY=y;
  }
  function stopDraw() { drawing=false; }

  canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('mousemove', draw); canvas.addEventListener('mouseup', stopDraw); canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw); canvas.addEventListener('touchmove', draw); canvas.addEventListener('touchend', stopDraw);

  document.getElementById('clearCanvas')?.addEventListener('click', () => { ctx.clearRect(0,0,canvas.width,canvas.height); });
  document.getElementById('saveCanvas')?.addEventListener('click', () => {
    const link = document.createElement('a'); link.download = 'my-devedu-art.png'; link.href = canvas.toDataURL(); link.click();
    localStorage.setItem('devedu_drawing_saved','true'); awardXP(XP_REWARDS.drawing_save,'Drawing saved!'); checkAchievements();
  });
}

// ──── CODING SANDBOX ────
function initCodingSandbox() {
  const editor = document.getElementById('codeEditor');
  const output = document.getElementById('codeOutput');
  const run = document.getElementById('runCode');
  if (!editor || !output || !run) return;

  // Allow Tab in textarea
  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); const s=editor.selectionStart, end=editor.selectionEnd; editor.value=editor.value.substring(0,s)+'  '+editor.value.substring(end); editor.selectionStart=editor.selectionEnd=s+2; }
  });

  run.addEventListener('click', () => {
    const code = editor.value;
    output.textContent = '';
    const oldLog = console.log;
    let logs = [];
    console.log = (...args) => { logs.push(args.map(a => typeof a==='object' ? JSON.stringify(a,null,2) : String(a)).join(' ')); };
    try { eval(code); output.textContent = logs.join('\n') || 'Code ran successfully!'; output.style.color = '#a6e3a1'; }
    catch(err) { output.textContent = `Error: ${err.message}`; output.style.color = '#f38ba8'; }
    console.log = oldLog;
    localStorage.setItem('devedu_code_run','true'); awardXP(XP_REWARDS.coding_run,'Code executed!'); checkAchievements();
  });
}

// ──── MUSIC MAKER ────
function initMusicMaker() {
  const container = document.querySelector('.piano-keys');
  if (!container) return;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [{n:'C',f:261.63},{n:'D',f:293.66},{n:'E',f:329.63},{n:'F',f:349.23},{n:'G',f:392.00},{n:'A',f:440.00},{n:'B',f:493.88},{n:'C',f:523.25},{n:'D',f:587.33},{n:'E',f:659.25},{n:'F',f:698.46},{n:'G',f:783.99},{n:'A',f:880.00}];

  notes.forEach(note => {
    const key = document.createElement('div');
    key.className = 'piano-key';
    key.textContent = note.n;
    key.addEventListener('mousedown', () => playNote(note.f, key));
    key.addEventListener('touchstart', e => { e.preventDefault(); playNote(note.f, key); });
    container.appendChild(key);
  });

  function playNote(freq, el) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    el.classList.add('active'); setTimeout(()=>el.classList.remove('active'), 200);
    localStorage.setItem('devedu_music_played','true'); checkAchievements();
  }
}

// ──── CALCULATOR ────
function initCalculator() {
  const display = document.querySelector('.calc-display');
  if (!display) return;
  let expr = '';
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.val;
      if (v === 'C') { expr=''; display.textContent='0'; }
      else if (v === '=') { try { display.textContent = Function('"use strict";return ('+expr+')')(); } catch { display.textContent = 'Error'; } expr=''; }
      else if (v === '⌫') { expr = expr.slice(0,-1); display.textContent = expr || '0'; }
      else { expr += v; display.textContent = expr; }
    });
  });
}

// ──── YOGA / BREATHING TIMER ────
function initYogaTimer() {
  const timer = document.querySelector('.yoga-timer');
  const inner = document.querySelector('.yoga-timer-inner');
  const startBtn = document.getElementById('yogaStart');
  const phaseText = document.getElementById('yogaPhase');
  if (!timer || !startBtn) return;
  let running = false, interval;
  const phases = [{name:'Breathe In',duration:4},{name:'Hold',duration:4},{name:'Breathe Out',duration:6}];

  startBtn.addEventListener('click', () => {
    if (running) { clearInterval(interval); running=false; startBtn.textContent='Start'; return; }
    running = true; startBtn.textContent = 'Stop';
    let phaseIdx=0, sec=0, totalCycles=0;
    interval = setInterval(() => {
      sec++;
      const phase = phases[phaseIdx];
      const pct = (sec / phase.duration) * 100;
      timer.style.setProperty('--yoga-progress', `${pct}%`);
      if (inner) inner.textContent = phase.duration - sec;
      if (phaseText) phaseText.textContent = phase.name;
      if (sec >= phase.duration) { sec=0; phaseIdx=(phaseIdx+1)%phases.length; if(phaseIdx===0) totalCycles++; }
      if (totalCycles >= 5) { clearInterval(interval); running=false; startBtn.textContent='Start'; if(inner) inner.textContent='🧘'; if(phaseText) phaseText.textContent='Done! Great job!'; awardXP(15,'Yoga session!'); }
    }, 1000);
  });
}

// ──── INDIAN STORIES ────
const STORIES = [
  { title:{en:"The Clever Crow",hi:"चतुर कौआ"}, moral:{en:"Intelligence solves problems",hi:"बुद्धि से समस्याएं हल होती हैं"}, content:{en:"Once upon a time, a thirsty crow found a pot with very little water at the bottom. The crow couldn't reach the water. So it gathered pebbles one by one and dropped them into the pot. Slowly the water level rose and the crow was able to drink! The crow taught us that patience and cleverness can solve any problem.",hi:"एक बार एक प्यासा कौआ एक बर्तन में बहुत कम पानी देखा। कौआ पानी तक नहीं पहुंच सका। उसने एक-एक करके कंकड़ डाले और धीरे-धीरे पानी ऊपर आ गया! कौए ने सिखाया कि धैर्य और बुद्धि से कोई भी समस्या हल हो सकती है।"}, age:"3-7" },
  { title:{en:"The Lion and the Mouse",hi:"शेर और चूहा"}, moral:{en:"Even small friends can help",hi:"छोटे दोस्त भी मदद कर सकते हैं"}, content:{en:"A lion caught a tiny mouse. The mouse begged, 'Please let me go. Someday I will help you!' The lion laughed but let the mouse go. Days later, the lion was trapped in a net. The little mouse gnawed through the ropes and set the lion free. No act of kindness, no matter how small, is ever wasted.",hi:"एक शेर ने छोटे चूहे को पकड़ा। चूहे ने कहा, 'मुझे छोड़ दो, एक दिन मैं आपकी मदद करूंगा!' शेर हंसा लेकिन छोड़ दिया। कुछ दिन बाद शेर जाल में फंस गया। चूहे ने रस्सियां काट दीं! कोई भी दया कभी व्यर्थ नहीं जाती।"}, age:"3-7" },
  { title:{en:"Birbal's Wisdom",hi:"बीरबल की बुद्धि"}, moral:{en:"Wisdom is more powerful than wealth",hi:"बुद्धि धन से अधिक शक्तिशाली है"}, content:{en:"Emperor Akbar once asked his courtiers, 'What is the greatest power?' Many said money, army, or land. Birbal said, 'Wisdom, Your Majesty. With wisdom, you can earn everything else.' To prove it, Akbar gave Birbal an impossible task. Within a day, Birbal solved it using only his intelligence. The emperor agreed that wisdom truly is the greatest power.",hi:"अकबर ने दरबारियों से पूछा, 'सबसे बड़ी शक्ति क्या है?' कई ने पैसा, सेना कहा। बीरबल ने कहा, 'बुद्धि, महाराज। बुद्धि से सब कुछ मिल सकता है।' अकबर ने असंभव काम दिया। बीरबल ने एक दिन में बुद्धि से हल कर दिया!"}, age:"8-12" },
  { title:{en:"The Unity of Sticks",hi:"लकड़ियों की एकता"}, moral:{en:"United we stand, divided we fall",hi:"एकता में बल है"}, content:{en:"An old man had three sons who always fought. He gave each son a single stick and asked them to break it. They did it easily. Then he gave them a bundle of sticks tied together. None could break it. 'See?' he said. 'Together you are strong. Alone you are weak.' The brothers understood and never fought again.",hi:"एक बूढ़े के तीन बेटे हमेशा लड़ते थे। उसने एक-एक लकड़ी दी और तोड़ने को कहा - सबने आसानी से तोड़ दी। फिर बंधी हुई लकड़ियां दीं - कोई नहीं तोड़ सका। 'देखा? साथ में ताकत है।' भाइयों ने समझ लिया और फिर कभी नहीं लड़े।"}, age:"8-12" },
  { title:{en:"Swami Vivekananda's Courage",hi:"स्वामी विवेकानंद का साहस"}, moral:{en:"Courage and knowledge can change the world",hi:"साहस और ज्ञान दुनिया बदल सकते हैं"}, content:{en:"In 1893, a young Indian monk stood before thousands at the Parliament of World's Religions in Chicago. He began with 'Sisters and Brothers of America' and received a standing ovation. Swami Vivekananda showed the world the depth of Indian philosophy. He proved that one person with courage and knowledge can represent an entire civilization with pride.",hi:"1893 में एक युवा भारतीय संन्यासी शिकागो में विश्व धर्म संसद में खड़ा हुआ। 'अमेरिका की बहनों और भाइयों' कहते ही सब खड़े हो गए। स्वामी विवेकानंद ने दुनिया को भारतीय दर्शन की गहराई दिखाई।"}, age:"13-18" },
];

let currentStory = 0;
function renderStory() {
  const reader = document.querySelector('.story-reader');
  if (!reader) return;
  const s = STORIES.filter(st => matchesAgeGroup(st.age, state.ageGroup));
  if (!s.length) return;
  const story = s[currentStory % s.length];
  const lang = state.language === 'hi' ? 'hi' : 'en';
  reader.querySelector('.story-title').textContent = story.title[lang];
  reader.querySelector('.story-content').textContent = story.content[lang];
  reader.querySelector('.story-moral').textContent = `Moral: ${story.moral[lang]}`;
  reader.querySelector('.story-count').textContent = `${(currentStory%s.length)+1}/${s.length}`;
}
function initStoryReader() {
  document.getElementById('storyPrev')?.addEventListener('click', () => { currentStory--; if(currentStory<0) currentStory=STORIES.length-1; renderStory(); });
  document.getElementById('storyNext')?.addEventListener('click', () => {
    currentStory++;
    const count = parseInt(localStorage.getItem('devedu_stories_read')||'0');
    localStorage.setItem('devedu_stories_read', String(count+1));
    awardXP(XP_REWARDS.story_read, 'Story read!');
    renderStory(); checkAchievements();
  });
  document.getElementById('storyVoice')?.addEventListener('click', () => {
    const el = document.querySelector('.story-content');
    if(el) speakText(el.textContent);
  });
  renderStory();
}

// ──── CONFETTI ────
function showConfetti() {
  const c = document.createElement('div'); c.className='confetti-container'; document.body.appendChild(c);
  const colors = ['#f2a900','#0d7377','#e4572e','#1f9a6e','#1976d2','#e91e63'];
  for(let i=0;i<40;i++) {
    const p=document.createElement('div'); p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}%;top:${60+Math.random()*40}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*0.5}s;animation-duration:${1+Math.random()}s;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;`;
    c.appendChild(p);
  }
  setTimeout(()=>c.remove(), 2500);
}

// ──── TOAST ────
function ensureToastContainer() { let c=document.querySelector('.toast-container'); if(c) return c; c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); return c; }
function showToast(msg, type='') {
  const c = ensureToastContainer();
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg; c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(8px)';},2200);
  setTimeout(()=>t.remove(),2600);
}

// ──── SETTINGS PANEL ────
function initSettings() {
  const btn = document.querySelector('[data-open-settings]');
  const panel = document.querySelector('.settings-panel');
  const overlay = document.querySelector('.settings-overlay');
  const close = document.querySelector('[data-close-settings]');
  if (!btn || !panel) return;

  function toggle(open) { panel.classList.toggle('open', open); overlay?.classList.toggle('open', open); }
  btn.addEventListener('click', () => toggle(true));
  close?.addEventListener('click', () => toggle(false));
  overlay?.addEventListener('click', () => toggle(false));

  // Dark mode toggle
  document.querySelector('[data-toggle-dark]')?.addEventListener('click', function() {
    this.classList.toggle('active');
    setTheme(this.classList.contains('active') ? 'dark' : 'light');
  });

  // Accessibility toggles
  document.querySelector('[data-toggle-dyslexia]')?.addEventListener('click', function() {
    this.classList.toggle('active');
    document.documentElement.setAttribute('data-accessibility', this.classList.contains('active') ? 'dyslexia' : '');
  });
  document.querySelector('[data-toggle-contrast]')?.addEventListener('click', function() {
    this.classList.toggle('active');
    document.documentElement.setAttribute('data-accessibility', this.classList.contains('active') ? 'high-contrast' : '');
  });
}

// ──── MOBILE DRAWER ────
function initMobileDrawer() {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.mobile-drawer');
  const close = document.querySelector('.drawer-close');
  if (!hamburger || !drawer) return;
  hamburger.addEventListener('click', () => drawer.classList.add('open'));
  close?.addEventListener('click', () => drawer.classList.remove('open'));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));
}

// ──── INTERSECTION OBSERVER ANIMATIONS ────
function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ──── PAGE VISIT TRACKER ────
function trackPageVisit() {
  const count = parseInt(localStorage.getItem('devedu_pages_visited')||'0');
  const visited = JSON.parse(localStorage.getItem('devedu_visited_pages')||'[]');
  const page = window.location.pathname.split('/').pop()||'index.html';
  if (!visited.includes(page)) { visited.push(page); localStorage.setItem('devedu_visited_pages',JSON.stringify(visited)); localStorage.setItem('devedu_pages_visited',String(visited.length)); }
}

// ──── VIDEO HELPERS ────
function normalizeUrl(u) { return /^https?:\/\//i.test(u) ? u : `https://${u}`; }
function getYoutubeId(url) { try { const p=new URL(url); if(p.hostname.includes('youtu.be')) return p.pathname.replace('/',''); if(p.hostname.includes('youtube.com')){ if(p.pathname.startsWith('/shorts/')) return p.pathname.replace('/shorts/',''); if(p.pathname.startsWith('/embed/')) return p.pathname.replace('/embed/',''); return p.searchParams.get('v'); } } catch{} return null; }
function setVideoPreviewFromUrl(frame,url) { frame.innerHTML=''; const id=getYoutubeId(url); if(id) { const i=document.createElement('iframe'); i.src=`https://www.youtube.com/embed/${id}`; i.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture'; i.allowFullscreen=true; frame.appendChild(i); return; } if(/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)){ const v=document.createElement('video'); v.controls=true; v.src=url; frame.appendChild(v); return; } const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='Open video'; frame.appendChild(a); }
function loadLessonMedia() { try{return JSON.parse(localStorage.getItem(`devedu_lesson_media_${state.profile}`)||'{}');}catch{return{};} }
function saveLessonMedia(m) { localStorage.setItem(`devedu_lesson_media_${state.profile}`,JSON.stringify(m)); }
function updateLessonMediaPreviews() { const m=loadLessonMedia(); document.querySelectorAll('[data-lesson-id]').forEach(c=>{const id=c.dataset.lessonId,f=c.querySelector('[data-lesson-preview]'); if(!f) return; const url=m[id]||recommendedLessonVideos[id]; if(!url){f.textContent=f.dataset.defaultLabel||'Video';return;} setVideoPreviewFromUrl(f,url);}); }

// ──── DOWNLOAD HELPERS ────
function downloadFile(name,content,mime) { const b=new Blob([content],{type:mime}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); }

// ──── GENERIC BUTTON ACTIONS ────
function attachGenericButtonActions() {
  document.querySelectorAll('button.button').forEach(btn => {
    const ignore = btn.hasAttribute('data-lang')||btn.hasAttribute('data-age')||btn.hasAttribute('data-tts')||btn.hasAttribute('data-progress-toggle')||btn.hasAttribute('data-start-lesson')||btn.hasAttribute('data-add-profile')||btn.hasAttribute('data-add-lesson-video')||btn.hasAttribute('data-action')||btn.hasAttribute('data-theme-toggle')||btn.hasAttribute('data-open-settings')||btn.hasAttribute('data-close-settings')||btn.hasAttribute('data-toggle-dark')||btn.hasAttribute('data-toggle-dyslexia')||btn.hasAttribute('data-toggle-contrast')||btn.id==='lessonPlayerVoice'||btn.id==='lessonPlayerMark'||btn.id==='runCode'||btn.id==='clearCanvas'||btn.id==='saveCanvas'||btn.id==='yogaStart'||btn.id==='storyPrev'||btn.id==='storyNext'||btn.id==='storyVoice'||btn.closest('.ai-chat-input')||btn.closest('.calculator')||btn.closest('.piano-keys');
    if(ignore) return;
    btn.addEventListener('click', () => {
      const label = btn.dataset.en || btn.textContent.trim();
      if(label==='Enroll'){showToast('Enrollment saved (demo)');return;}
      if(label==='Start Quiz'||label==='Play'){const q=document.getElementById('quiz');if(q)q.scrollIntoView({behavior:'smooth',block:'start'});else window.location.href='games.html#quiz';return;}
      if(label==='Daily Plan'){window.location.href='daily.html';return;}
      if(label==='Save'){const ta=btn.closest('.card')?.querySelector('textarea');if(ta){localStorage.setItem(`devedu_kindness_${state.profile}`,ta.value);showToast('Saved! +25 XP','success');awardXP(XP_REWARDS.kindness,'Kindness logged!');}return;}
      if(label==='Download Report'){downloadFile('report.txt','DevEdu Report (demo)','text/plain');return;}
      if(label==='Download PDF'){downloadFile('weekly-report.pdf','DevEdu Weekly Summary','application/pdf');return;}
      if(label==='Download CSV'){downloadFile('progress.csv','subject,score\nmath,78\nscience,64\n','text/csv');return;}
      if(label==='Export'){downloadFile('portfolio.json',JSON.stringify({project:'DevEdu',status:'demo'},null,2),'application/json');return;}
      if(label==='Login'){showToast('Login successful (demo)');window.location.href='parents.html';return;}
      if(label==='Help'){showToast('Support is on the way!');return;}
      if(label==='Open Dashboard'){window.location.href='parents.html';return;}
      if(label==='View Details'){showToast('Details opened (demo)');return;}
      if(label==='Plan Week'){window.location.href='daily.html';return;}
      showToast('Action completed (demo)');
    });
  });
}

// ──── INIT ────
function init() {
  loadState();
  if(state.theme==='dark') setTheme('dark');
  renderProfileOptions();
  loadVoices();
  if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged = loadVoices;

  // Language buttons
  document.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

  // Theme toggle
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => setTheme(state.theme==='dark'?'light':'dark')));

  // Age toggles
  document.querySelectorAll('[data-age]').forEach(btn => btn.addEventListener('click', () => setAgeGroup(btn.dataset.age)));

  // Filters
  ['ageFilter','boardFilter','lessonSearch'].forEach(id => document.getElementById(id)?.addEventListener('input', filterLessons));

  // TTS
  document.querySelectorAll('[data-tts]').forEach(btn => btn.addEventListener('click', () => { const el=document.getElementById(btn.getAttribute('data-tts')); if(el) speakText(el.textContent.trim()); }));

  // Profile controls
  document.querySelectorAll('[data-profile-select]').forEach(sel => sel.addEventListener('change', () => { state.profile=sel.value; saveState(); syncProfileUI(); }));
  document.querySelectorAll('[data-new-profile]').forEach(input => {
    const btn = input.closest('.profile-form')?.querySelector('[data-add-profile]');
    btn?.addEventListener('click', () => {
      const name=input.value.trim(); if(!name) return;
      const profiles=getProfiles(); if(!profiles.includes(name)){profiles.push(name);saveProfiles(profiles);}
      if(!profileDefaults[name]) profileDefaults[name]={ageGroup:state.ageGroup,progress:{math:50,science:50,languages:50},values:{empathy:50,responsibility:50,safety:50},profile:{nickname:name,goal:'Learn with joy',favorite:'Stories',style:'Play'}};
      state.profile=name; input.value=''; renderProfileOptions(); saveState(); syncProfileUI();
    });
  });
  document.querySelectorAll('[data-profile-field]').forEach(input => input.addEventListener('input', () => {
    const pd=getProfileData(); if(!pd) return; pd.profile=pd.profile||{}; pd.profile[input.dataset.profileField]=input.value; saveProfileData(pd); renderPersonalAI();
  }));

  // Progress toggles
  document.querySelectorAll('[data-progress-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const target=btn.closest('[data-progress-item]'); if(!target) return;
    const key=target.dataset.progressItem; const p=loadProgress(); p[key]=!p[key]; saveProgress(p);
    if(p[key]) awardXP(XP_REWARDS.lesson_done,'Task completed!');
    syncProgressUI(); checkAchievements();
  }));

  // Start lesson buttons
  document.querySelectorAll('[data-start-lesson]').forEach(btn => btn.addEventListener('click', () => {
    const card=btn.closest('[data-lesson-id]'); if(!card) return;
    const id=card.dataset.lessonId; const p=loadProgress();
    if(!isLessonUnlocked(id,p)){const prereqs=(lessonPrereqs[id]||[]).map(getLessonLabel);alert(state.language==='hi'?`पहले ये पूरे करें: ${prereqs.join(', ')}`:`Complete these first: ${prereqs.join(', ')}`);return;}
    showLessonPlayer(card);
  }));
  document.getElementById('lessonPlayerVoice')?.addEventListener('click', () => { const d=document.getElementById('lessonPlayerDesc'); if(d) speakText(d.textContent); });
  document.getElementById('lessonPlayerMark')?.addEventListener('click', () => {
    const t=document.getElementById('lessonPlayerTitle'); if(!t) return;
    const card=[...document.querySelectorAll('[data-lesson-id]')].find(c=>c.querySelector('h3')?.textContent===t.textContent);
    if(!card) return; const key=card.dataset.progressItem; const p=loadProgress(); p[key]=true; saveProgress(p);
    awardXP(XP_REWARDS.lesson_done,'Lesson completed!'); syncProgressUI(); checkAchievements(); showConfetti();
  });

  // Lesson video buttons
  document.querySelectorAll('[data-add-lesson-video]').forEach(btn => btn.addEventListener('click', () => {
    const card=btn.closest('[data-lesson-id]'); if(!card) return;
    const id=card.dataset.lessonId; const url=window.prompt('Paste video URL:');
    if(url===null) return; const m=loadLessonMedia(); if(!url.trim()) delete m[id]; else m[id]=normalizeUrl(url.trim()); saveLessonMedia(m); updateLessonMediaPreviews();
  }));

  // Action buttons
  document.querySelectorAll("[data-action='go-learn']").forEach(b=>b.addEventListener('click',()=>window.location.href='learn.html'));
  document.querySelectorAll("[data-action='open-trail']").forEach(b=>b.addEventListener('click',()=>window.location.href='daily.html'));

  // Drop zones
  document.querySelectorAll('[data-drop-zone]').forEach(zone => {
    const input=zone.querySelector("input[type='file']"); const frame=zone.closest('.media-card')?.querySelector('.video-frame');
    zone.addEventListener('click',()=>input&&input.click());
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.style.background='#fff1db';});
    zone.addEventListener('dragleave',()=>zone.style.background='');
    zone.addEventListener('drop',e=>{e.preventDefault();zone.style.background='';const f=e.dataTransfer.files;if(f&&f.length){zone.querySelector('.drop-label').textContent=f[0].name;}});
  });

  attachGenericButtonActions();
  updateLessonMediaPreviews();
  renderResourceLists();
  renderBookLists();
  initAIChat();
  initDrawingCanvas();
  initCodingSandbox();
  initMusicMaker();
  initCalculator();
  initYogaTimer();
  initStoryReader();
  initSettings();
  initMobileDrawer();
  initRevealAnimations();
  trackPageVisit();
  setLanguage(state.language);
  setAgeGroup(state.ageGroup);
  syncProfileUI();
  filterAgeGroupElements();
  checkStreak();
}

document.addEventListener('DOMContentLoaded', init);
