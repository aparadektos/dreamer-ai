import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Moon, 
  Sparkles, 
  LogOut, 
  Send, 
  Twitter, 
  MessageCircle,
  Image as ImageIcon,
  Menu, 
  X, 
  ArrowLeft, 
  Globe, 
  Mic, 
  MicOff, 
  Settings, 
  Save, 
  Activity, 
  ListFilter, 
  Facebook, 
  Instagram, 
  Copy, 
  Search,
  BookOpen,
  RefreshCw,
  ShieldCheck,
  Database,
  Globe2,
  Clock
} from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  getDoc,
  onSnapshot, 
  serverTimestamp,
  doc
} from 'firebase/firestore';

// --- Global Configuration ---
const PROVIDED_GOOGLE_AI_KEY = "AIzaSyBkGtdHNHq8ZjAPzIza6DmiBIDK3atHMic";
const DEFAULT_MODEL = "gemini-2.5-flash-preview-09-2025"; 

const initialFirebaseConfig = {
  apiKey: "AIzaSyDOKzFRXCErXJZ-FHzIrnaq0hIIbtj5G-o",
  authDomain: "dreamer-ai-176ec.firebaseapp.com",
  projectId: "dreamer-ai-176ec",
  storageBucket: "dreamer-ai-176ec.firebasestorage.app",
  messagingSenderId: "239120576843",
  appId: "1:239120576843:web:74481c230fd488d2d138ce",
  measurementId: "G-71918YCW4J"
};

const initialAppId = 'dreamer-ai-176ec';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Portυγαλικά' },
  { code: 'ja', name: '日本語' }
];

const UI_STRINGS = {
  en: {
    appTitle: "Dreamer AI", tagline: "Decode your soul.", begin: "Join the Dream", resume: "Resume Journey", email: "Email Address", passkey: "Passkey", firstName: "First Name", lastName: "Last Name", login: "Login", join: "Create Identity", demoUser: "Try Demo Credentials", history: "Past Echoes", newDream: "New Dream", logout: "Logout", tapestry: "New Dream", placeholder: "Close your eyes... what did you see?", decipher: "Decipher Dream", weaving: "Weaving...", listening: "Capturing echoes...", return: "Return", symbols: "Arcane Symbols", reflection: "Reflection", adminNexus: "Admin Nexus", share: "Share your dream", logs: "Activity Logs", signup: "Sign Up", lexicon: "Global Lexicon", lexiconSearch: "Search 1,000+ symbols...", noResults: "The Lexicon is silent.", syncLexicon: "Sync Neural Dictionary", discoverAI: "AI Symbol Discovery", lastSync: "Last Subconscious Sync"
  },
  el: {
    appTitle: "Dreamer AI", tagline: "Αποκωδικοποίηση ψυχής.", begin: "Εγγραφή στο Όνειρο", resume: "Συνέχεια Ταξιδιού", email: "Email", passkey: "Κωδικός", firstName: "Όνομα", lastName: "Επώνυμο", login: "Είσοδος", join: "Δημιουργία Ταυτότητας", demoUser: "Δοκιμή Demo", history: "Παλιές Ηχώ", newDream: "Νέο Όνειρο", logout: "Αποσύνδεση", tapestry: "Νέο Όνειρο", placeholder: "Κλείστε τα μάτια... τι είδατε;", decipher: "Αποκρυπτογράφηση", weaving: "Ύφανση...", listening: "Καταγραφή...", return: "Επιστροφή", symbols: "Σύμβολα", reflection: "Στοχασμός", adminNexus: "Κέντρο Διαχείρισης", logs: "Καταγραφές", share: "Μοιραστείτε το όνειρό σας", signup: "Εγγραφή", lexicon: "Παγκόσμιο Λεξικό", lexiconSearch: "Αναζήτηση σε σύμβολα...", noResults: "Το Λεξικό σιωπά.", syncLexicon: "Συγχρονισμός Λεξικού", discoverAI: "Ανακάλυψη Συμβόλων AI", lastSync: "Τελευταίος Συγχρονισμός"
  }
};

const getUI = (lang, key) => UI_STRINGS[lang]?.[key] || UI_STRINGS['en'][key];

export default function App() {
  const [view, setView] = useState('auth'); 
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    firebase: initialFirebaseConfig,
    appId: initialAppId,
    googleAiKey: PROVIDED_GOOGLE_AI_KEY,
    textModel: DEFAULT_MODEL
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [logs, setLogs] = useState([]);
  const [dreamInput, setDreamInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lexiconData, setLexiconData] = useState([]);
  const [lexiconSearch, setLexiconSearch] = useState('');
  const [activeTab, setActiveTab] = useState('weave'); 
  const [isLexiconSyncing, setIsLexiconSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState(null);

  const authInstance = useRef(null);
  const dbInstance = useRef(null);
  const recognitionRef = useRef(null);

  const addLog = (action, type = 'info') => {
    const actionStr = typeof action === 'object' ? JSON.stringify(action) : String(action);
    setLogs(prev => [{ id: Date.now(), timestamp: new Date().toLocaleTimeString(), action: actionStr, type }, ...prev].slice(0, 100));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const app = getApps().length === 0 ? initializeApp(config.firebase) : getApp();
        authInstance.current = getAuth(app);
        dbInstance.current = getFirestore(app);

        const unsubscribe = onAuthStateChanged(authInstance.current, async (u) => {
          setUser(u);
          if (u) {
            try {
              const profileRef = doc(dbInstance.current, 'artifacts', config.appId, 'users', u.uid, 'profile', 'data');
              const snap = await getDoc(profileRef);
              if (snap.exists()) setProfile(snap.data());
              addLog(`Identity Synced: ${u.email || 'Dreamer'}`, 'success');
              checkAndAutoUpdateLexicon();
            } catch (e) { addLog(`Profile Sync: ${e.message}`, "warning"); }
            if (view === 'auth' || view === 'admin-login') setView('dashboard');
          } else if (!['admin-login', 'admin-panel'].includes(view)) {
            setView('auth');
          }
        });
        return unsubscribe;
      } catch (err) { addLog(`System Failure: ${err.message}`, 'error'); }
    };
    init();
  }, [config.firebase]);

  useEffect(() => {
    if (!user || !dbInstance.current) return;
    const dreamsRef = collection(dbInstance.current, 'artifacts', config.appId, 'users', user.uid, 'dreams');
    const unsubDreams = onSnapshot(dreamsRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    const lexiconRef = collection(dbInstance.current, 'artifacts', config.appId, 'public', 'data', 'lexicon');
    const unsubLexicon = onSnapshot(lexiconRef, (snapshot) => {
      setLexiconData(snapshot.docs.map(doc => doc.data()));
    });
    const metaRef = doc(dbInstance.current, 'artifacts', config.appId, 'public', 'data', 'metadata', 'status');
    const unsubMeta = onSnapshot(metaRef, (snapshot) => {
      if (snapshot.exists()) setLastSyncDate(snapshot.data().lastAutoUpdate);
    });
    return () => { unsubDreams(); unsubLexicon(); unsubMeta(); };
  }, [user, config.appId]);

  const checkAndAutoUpdateLexicon = async () => {
    if (!dbInstance.current) return;
    const metaRef = doc(dbInstance.current, 'artifacts', config.appId, 'public', 'data', 'metadata', 'status');
    try {
      const snap = await getDoc(metaRef);
      let needsUpdate = !snap.exists();
      if (snap.exists()) {
        const lastUpdate = snap.data().lastAutoUpdate?.toDate();
        if (lastUpdate) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (lastUpdate < thirtyDaysAgo) needsUpdate = true;
        }
      }
      if (needsUpdate) {
        addLog("Neural Dictionary update triggered.", "info");
        await discoverNewSymbols(15);
        await setDoc(metaRef, { lastAutoUpdate: serverTimestamp() }, { merge: true });
      }
    } catch (err) { addLog(`Auto-Update Error: ${err.message}`, "error"); }
  };

  const fetchWithBackoff = async (url, options, retries = 5) => {
    let delay = 1000;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return await res.json();
        throw new Error(`API Error: ${res.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  };

  const weaveDream = async () => {
    if (dreamInput.length < 5) return;
    setIsProcessing(true); setError(null);
    try {
      const activeLang = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || "English";
      const promptText = `Mystical dream interpreter. Respond in ${activeLang}. User dream: "${dreamInput}". Output ONLY valid JSON: title, emotion, meaning (long paragraph), reflection (mystical question), symbols (array of {name, meaning}), visual_prompt (3D surreal scene prompt).`;
      const data = await fetchWithBackoff(`https://generativelanguage.googleapis.com/v1beta/models/${config.textModel}:generateContent?key=${config.googleAiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setCurrentResult(result); setView('result');
      const imgData = await fetchWithBackoff(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${config.googleAiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: { prompt: `Surreal vision: ${result.visual_prompt}` }, parameters: { sampleCount: 1 } })
      });
      const imageUrl = `data:image/png;base64,${imgData.predictions[0].bytesBase64Encoded}`;
      setCurrentResult(prev => ({ ...prev, imageUrl }));
      if (user && !user.isAnonymous) {
        await addDoc(collection(dbInstance.current, 'artifacts', config.appId, 'users', user.uid, 'dreams'), { ...result, imageUrl, createdAt: serverTimestamp() });
      }
    } catch (err) { setError(String(err.message)); }
    finally { setIsProcessing(false); }
  };

  const discoverNewSymbols = async (count = 5) => {
    setIsLexiconSyncing(true);
    try {
      const prompt = `JSON array of ${count} dream symbols from world cultures. Format: [{item: 'Name', meaning: 'Interpretation'}]. JSON ONLY.`;
      const data = await fetchWithBackoff(`https://generativelanguage.googleapis.com/v1beta/models/${config.textModel}:generateContent?key=${config.googleAiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const symbols = JSON.parse(data.candidates[0].content.parts[0].text);
      for (const s of symbols) {
        await addDoc(collection(dbInstance.current, 'artifacts', config.appId, 'public', 'data', 'lexicon'), s);
      }
      addLog(`Added ${symbols.length} symbols.`, "success");
    } catch (err) { addLog(`Sync Error: ${err.message}`, "error"); }
    finally { setIsLexiconSyncing(false); }
  };

  const handleToggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) { recognitionRef.current?.stop(); }
    else {
      const rec = new SpeechRecognition();
      rec.continuous = true; rec.interimResults = true;
      rec.lang = language === 'el' ? 'el-GR' : 'en-US';
      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) { if (e.results[i].isFinal) transcript += e.results[i][0].transcript; }
        if (transcript) setDreamInput(prev => (prev ? prev + ' ' : '') + transcript.trim());
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start(); setIsListening(true);
    }
  };

  const filteredLexicon = useMemo(() => {
    if (lexiconSearch.length < 3) return [];
    return lexiconData.filter(item => 
      String(item.item || "").toLowerCase().includes(lexiconSearch.toLowerCase()) ||
      String(item.meaning || "").toLowerCase().includes(lexiconSearch.toLowerCase())
    ).slice(0, 50);
  }, [lexiconSearch, lexiconData]);

  const waveBackground = useMemo(() => (
    <div className="fixed inset-0 -z-10 bg-[#2a1b4d] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b2063] to-[#1a0b2e] opacity-95"></div>
      <svg className="absolute bottom-0 w-full h-80 text-indigo-400/5" preserveAspectRatio="none" viewBox="0 0 1440 320"><path fill="currentColor" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,128C672,139,768,213,864,229.3C960,245,1056,203,1152,181.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
    </div>
  ), []);

  const renderContent = () => {
    switch (view) {
      case 'admin-panel':
        return (
          <div className="p-6 max-w-7xl mx-auto space-y-6 h-screen overflow-y-auto pb-32 animate-in fade-in">
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
              <div className="flex items-center gap-4 text-white"><Activity className="text-indigo-300" /><h2 className="text-xl font-black uppercase text-white">Nexus</h2></div>
              <button onClick={() => setView('auth')} className="p-2 text-white/50"><X /></button>
            </div>
            <div className="space-y-6">
              <div className="bg-white/10 p-8 rounded-[2rem] border border-white/20 text-white">
                <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-indigo-300"><Settings size={14}/> Config</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Firebase Key", key: "apiKey", root: false },
                    { label: "Google AI Key", key: "googleAiKey", root: true, secret: true },
                    { label: "Text Model", key: "textModel", root: true },
                    { label: "App ID", key: "appId", root: true }
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase">{String(f.label)}</label>
                      <input type={f.secret ? "password" : "text"} value={String(f.root ? config[f.key] : config.firebase[f.key])} onChange={e => {
                        if (f.root) setConfig({...config, [f.key]: e.target.value});
                        else setConfig({...config, firebase: {...config.firebase, [f.key]: e.target.value}});
                      }} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs outline-none text-white" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 p-8 rounded-[2rem] border border-white/20 text-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black uppercase text-indigo-300">Cloud Lexicon</h3>
                  <span className="text-[10px] opacity-40 uppercase">Sync: {lastSyncDate ? lastSyncDate.toDate().toLocaleDateString() : 'Never'}</span>
                </div>
                <button onClick={() => discoverNewSymbols(10)} disabled={isLexiconSyncing} className="bg-indigo-500 px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 text-white">
                  <RefreshCw size={14} className={isLexiconSyncing ? 'animate-spin' : ''}/> Sync Now
                </button>
              </div>
              <div className="bg-white/10 h-64 overflow-y-auto rounded-[2rem] border border-white/20 p-4 text-white font-mono text-[10px]">
                {logs.map(l => <div key={l.id} className="p-2 border-b border-white/5 text-white">[{String(l.timestamp)}] {String(l.action)}</div>)}
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="flex h-screen overflow-hidden animate-in fade-in">
            <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-80 bg-white/5 backdrop-blur-2xl border-r border-white/10 transition-all ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-black text-xl uppercase truncate">Hello {String(profile?.firstName || 'Dreamer')}!</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/40"><X /></button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('weave')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'weave' ? 'bg-white text-indigo-950' : 'bg-white/10 text-white/40'}`}>Weave</button>
                  <button onClick={() => setActiveTab('lexicon')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'lexicon' ? 'bg-white text-indigo-950' : 'bg-white/10 text-white/40'}`}>Lexicon</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 text-white">
                <h2 className="px-4 py-2 text-[10px] font-black opacity-30 uppercase text-white">History</h2>
                {history.map(item => (
                  <button key={item.id} onClick={() => {setCurrentResult(item); setView('result');}} className="w-full text-left p-4 rounded-2xl hover:bg-white/10 border border-transparent">
                    <span className="text-[10px] font-black uppercase text-indigo-300 mb-1 block">{String(item.emotion || "")}</span>
                    <span className="text-sm font-bold opacity-80 truncate block text-white">{String(item.title || "")}</span>
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-white/10"><button onClick={() => signOut(authInstance.current)} className="flex items-center gap-2 opacity-30 hover:opacity-100 text-[10px] font-black transition-all text-white uppercase"><LogOut size={14} /> Logout</button></div>
            </aside>
            <main className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto relative text-white">
              <header className="flex justify-between items-center mb-12">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-white/10 rounded-xl"><Menu size={20}/></button>
                <h2 className="text-3xl font-black uppercase text-white">{activeTab === 'weave' ? "New Dream" : "Lexicon"}</h2>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase outline-none text-white">
                  {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#1a0b2e] text-white">{String(l.name)}</option>)}
                </select>
              </header>
              {activeTab === 'weave' ? (
                <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center gap-8 pb-20">
                  <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[3.5rem] p-10 md:p-14 shadow-2xl flex flex-col gap-10">
                    <textarea value={dreamInput} onChange={e => setDreamInput(e.target.value)} placeholder={getUI(language, 'placeholder')} className="w-full h-48 md:h-72 bg-transparent text-2xl md:text-5xl placeholder-white/5 outline-none resize-none font-medium text-white leading-tight" />
                    <div className="flex items-center gap-5">
                      <button onClick={weaveDream} disabled={isProcessing || dreamInput.length < 5} className="flex-1 bg-white text-indigo-950 font-black py-7 rounded-[2.5rem] text-2xl uppercase flex items-center justify-center gap-4 active:scale-95 transition-all">
                        {isProcessing ? <span className="animate-pulse">Weaving...</span> : <><Send size={24} /> Decipher</>}
                      </button>
                      <button onClick={handleToggleMic} className={`p-7 rounded-[2.5rem] border-2 transition-all ${isListening ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-white/10 border-white/20 text-indigo-200'}`}>{isListening ? <MicOff size={28} /> : <Mic size={28} />}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl w-full mx-auto space-y-8 animate-in slide-in-from-bottom-6 pb-20 text-white">
                  <div className="relative text-white/30"><Search className="absolute left-6 top-1/2 -translate-y-1/2" size={20} /><input type="text" value={lexiconSearch} onChange={e => setLexiconSearch(e.target.value)} placeholder="Search symbols..." className="w-full bg-white/5 border border-white/10 py-5 pl-14 pr-6 rounded-[2rem] text-xl text-white outline-none focus:border-indigo-500 transition-all" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    {lexiconSearch.length >= 3 && filteredLexicon.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-white">
                        <h3 className="text-lg font-black uppercase text-indigo-300 mb-2 tracking-widest flex items-center gap-2"><Sparkles size={16}/>{String(item.item || "")}</h3>
                        <p className="text-sm opacity-60 italic text-white">"{String(item.meaning || "")}"</p>
                      </div>
                    ))}
                    {lexiconSearch.length < 3 && <div className="col-span-full py-20 text-center opacity-20 uppercase font-black tracking-widest text-xs text-white">Enter 3 letters...</div>}
                  </div>
                </div>
              )}
            </main>
          </div>
        );
      case 'result':
        return (
          <div className="min-h-screen p-6 md:p-12 overflow-y-auto animate-in zoom-in-95 bg-[#2a1b4d] text-white">
            <div className="max-w-6xl mx-auto space-y-10">
              <button onClick={() => setView('dashboard')} className="flex items-center gap-3 text-indigo-200 font-black uppercase text-[10px] tracking-widest"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ArrowLeft size={16} /></div> Back</button>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 bg-white/10 p-12 rounded-[3.5rem] border border-white/20 space-y-10 shadow-2xl">
                  <header>
                    <span className="inline-block px-5 py-2 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase mb-6">{String(currentResult?.emotion || "")}</span>
                    <h2 className="text-5xl font-black leading-none mb-8 tracking-tighter uppercase text-white">{String(currentResult?.title || "")}</h2>
                    <p className="text-indigo-50/80 text-xl leading-relaxed font-light text-white">{String(currentResult?.meaning || "")}</p>
                  </header>
                  <p className="p-10 bg-indigo-500/10 border border-indigo-300/20 rounded-[3rem] italic text-indigo-200 text-2xl font-bold leading-relaxed">"{String(currentResult?.reflection || "")}"</p>
                  <div className="flex flex-wrap gap-4 pt-8 border-t border-white/10">
                    {['twitter', 'facebook', 'instagram', 'copy'].map(p => (
                      <button key={p} onClick={() => {
                        const msg = `Dreamer AI decoded my vision: "${currentResult.title}"`;
                        if (p==='copy') { navigator.clipboard.writeText(msg); setError("Copied!"); setTimeout(()=>setError(null),2000); }
                        else window.open(`https://${p}.com`, '_blank');
                      }} className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl transition-all uppercase text-[10px] font-black hover:bg-white/10 text-white">{String(p)}</button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-5 space-y-8 text-white">
                  <div className="aspect-square bg-white/5 rounded-[4rem] border-2 border-white/10 overflow-hidden relative flex items-center justify-center">
                    {currentResult?.imageUrl ? <img src={currentResult.imageUrl} className="w-full h-full object-cover" /> : <div className="text-center">{imageLoading ? <div className="animate-spin border-4 border-indigo-400 border-t-transparent w-12 h-12 rounded-full mx-auto mb-4"></div> : <ImageIcon size={64} className="opacity-10 text-white" />}</div>}
                  </div>
                  <div className="bg-white/10 p-10 rounded-[3rem] border border-white/20 shadow-xl">
                    <h3 className="text-[10px] font-black uppercase text-indigo-200 mb-8 tracking-widest text-white">Symbols</h3>
                    <div className="space-y-6 text-white">{currentResult?.symbols?.map((s, i) => (<div key={i} className="space-y-1"><span className="text-sm font-black text-indigo-100 uppercase block text-white">{String(s.name || "")}</span><p className="text-sm text-white/40">{String(s.meaning || "")}</p></div>))}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'admin-login':
      case 'auth':
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-in fade-in text-white">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <button onClick={() => setView('admin-login')} className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl hover:rotate-12 transition-all cursor-pointer"><Moon className="text-white w-10 h-10" /></button>
                <h1 className="text-4xl font-black text-white uppercase mt-6 tracking-widest">{getUI(language, 'appTitle')}</h1>
              </div>
              <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[3rem] overflow-hidden shadow-2xl">
                {view === 'admin-login' ? (
                  <div className="p-10 space-y-6 text-white animate-in slide-in-from-bottom-4">
                    <ShieldCheck className="w-12 h-12 text-indigo-300 mx-auto" />
                    <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="Nexus ID" className="w-full bg-white/5 border border-white/20 p-4 rounded-2xl outline-none text-white" />
                    <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Nexus Key" className="w-full bg-white/5 border border-white/20 p-4 rounded-2xl outline-none text-white" />
                    <button onClick={() => { if(adminUser==='admin' && adminPass==='admin') setView('admin-panel'); }} className="w-full bg-indigo-600 py-4 rounded-2xl font-black uppercase text-white">Enter Nexus</button>
                    <button onClick={() => setView('auth')} className="w-full text-xs opacity-40 text-white">Cancel</button>
                  </div>
                ) : (
                  <div className="p-10 space-y-4">
                    <div className="flex gap-2 p-2 bg-black/20 rounded-2xl">
                      <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${!isSignUp ? 'bg-white text-indigo-950' : 'text-white/40'}`}>Login</button>
                      <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${isSignUp ? 'bg-white text-indigo-950' : 'text-white/40'}`}>Sign Up</button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault(); setAuthLoading(true);
                      const action = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
                      action(authInstance.current, email, password).catch(err => setError(err.message)).finally(() => setAuthLoading(false));
                    }} className="space-y-4 text-white">
                      {isSignUp && <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-full bg-white/5 border border-white/20 p-4 rounded-2xl outline-none text-white" required />}
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/20 p-4 rounded-2xl outline-none text-white" required />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/20 p-4 rounded-2xl outline-none text-white" required />
                      <button type="submit" disabled={authLoading} className="w-full bg-indigo-500 py-4 rounded-2xl font-black uppercase shadow-lg text-white">
                        {authLoading ? "Wait..." : isSignUp ? "Create" : "Login"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
              {error && <p className="text-red-400 text-[10px] text-center">{String(error)}</p>}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-indigo-400 overflow-hidden relative">
      {waveBackground}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; } .animate-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {renderContent()}
    </div>
  );
}
