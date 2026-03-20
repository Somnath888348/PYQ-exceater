import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  BookOpen, 
  Link as LinkIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  History as HistoryIcon, 
  Sparkles,
  Layers,
  ExternalLink,
  Trash2,
  Moon,
  Sun,
  Clock,
  FileText,
  FileDown,
  Lightbulb,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Globe,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { extractQuestions, getHint, getSolution, generateImportantQuestions, searchBoardQuestions, Question } from './services/geminiService';

interface HistoryItem {
  id: string;
  chapter: string;
  studentClass: string;
  urls: string[];
  results: { url: string; questions: Question[] }[];
  timestamp: number;
}

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case 'সহজ': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'মধ্যম': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'কঠিন': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
};

function QuestionItem({ question, index, darkMode }: { question: Question; index: number; darkMode: boolean }) {
  const [hint, setHint] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [hintCopied, setHintCopied] = useState(false);
  const [solutionCopied, setSolutionCopied] = useState(false);

  const handleGetHint = async () => {
    if (hint) {
      setShowHint(!showHint);
      return;
    }
    setLoadingHint(true);
    try {
      const h = await getHint(question.text);
      setHint(h);
      setShowHint(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleGetSolution = async () => {
    if (solution) {
      setShowSolution(!showSolution);
      return;
    }
    setLoadingSolution(true);
    try {
      const s = await getSolution(question.text);
      setSolution(s);
      setShowSolution(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSolution(false);
    }
  };

  const copyHint = () => {
    if (!hint) return;
    navigator.clipboard.writeText(hint);
    setHintCopied(true);
    setTimeout(() => setHintCopied(false), 2000);
  };

  const copySolution = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setSolutionCopied(true);
    setTimeout(() => setSolutionCopied(false), 2000);
  };

  return (
    <div className="flex gap-4 group">
      <div className="text-slate-300 dark:text-slate-700 font-mono text-sm mt-1">{index + 1}.</div>
      <div className="space-y-4 flex-1">
        <div className="space-y-3">
          <p className={`text-base leading-relaxed transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {question.text}
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            {question.year && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {question.year.includes('গুরুত্বপূর্ণ') ? question.year : `সাল: ${question.year}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 print:hidden">
          <button
            onClick={handleGetHint}
            disabled={loadingHint}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showHint 
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' 
              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {loadingHint ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
            {showHint ? 'ইঙ্গিত লুকান' : 'ইঙ্গিত দেখুন'}
          </button>
          <button
            onClick={handleGetSolution}
            disabled={loadingSolution}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showSolution 
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' 
              : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {loadingSolution ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
            {showSolution ? 'সমাধান লুকান' : 'সমাধান দেখুন'}
          </button>
        </div>

        <AnimatePresence>
          {showHint && hint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-2 p-4 rounded-2xl border ${darkMode ? 'bg-amber-900/10 border-amber-900/30 text-amber-200/80' : 'bg-amber-50 border-amber-100 text-amber-800'} text-sm relative group/hint`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider opacity-60">
                    <Lightbulb size={12} />
                    ইঙ্গিত
                  </div>
                  <button 
                    onClick={copyHint}
                    className="p-1.5 rounded-lg hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition-colors opacity-0 group-hover/hint:opacity-100"
                  >
                    {hintCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{hint}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {showSolution && solution && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-2 p-6 rounded-2xl border ${darkMode ? 'bg-indigo-900/10 border-indigo-900/30 text-indigo-200/80' : 'bg-indigo-50 border-indigo-100 text-indigo-800'} text-sm relative group/sol`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider opacity-60">
                    <BrainCircuit size={12} />
                    ধাপে ধাপে সমাধান
                  </div>
                  <button 
                    onClick={copySolution}
                    className="p-1.5 rounded-lg hover:bg-indigo-200/50 dark:hover:bg-indigo-900/50 transition-colors opacity-0 group-hover/sol:opacity-100"
                  >
                    {solutionCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{solution}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [searchMode, setSearchMode] = useState<'link' | 'ai'>('link');
  const [urlsText, setUrlsText] = useState('');
  const [chapter, setChapter] = useState('');
  const [board, setBoard] = useState('West Bengal Board');
  const [studentClass, setStudentClass] = useState('Class 12');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ url: string; questions: Question[] }[] | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[] | null>(null);
  const [importantQuestions, setImportantQuestions] = useState<Question[] | null>(null);
  const [loadingImportant, setLoadingImportant] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history and theme from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pyq_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const savedTheme = localStorage.getItem('pyq_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('pyq_history', JSON.stringify(history));
  }, [history]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('pyq_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlsText.split('\n').map(u => u.trim()).filter(u => u !== '');
    if (urls.length === 0 || !chapter) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setImportantQuestions(null);
    setProgress({ current: 0, total: urls.length });

    try {
      const allResults: { url: string; questions: Question[] }[] = [];
      setSources(null);
      
      for (let i = 0; i < urls.length; i++) {
        setProgress({ current: i + 1, total: urls.length });
        const questions = await extractQuestions(urls[i], chapter, studentClass);
        if (questions.length > 0) {
          allResults.push({ url: urls[i], questions });
        }
      }

      if (allResults.length === 0) {
        setError(`"${chapter}" এর জন্য কোনো প্রশ্ন পাওয়া যায়নি। অনুগ্রহ করে সঠিক লিঙ্ক বা অধ্যায়ের নাম পরীক্ষা করুন।`);
      } else {
        setResults(allResults);
        
        // Automatically trigger important questions generation
        handleGenerateImportant();

        // Add to history
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          chapter,
          studentClass,
          urls,
          results: allResults,
          timestamp: Date.now(),
        };
        setHistory(prev => [newItem, ...prev].slice(0, 20));
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred while extracting questions.');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || !board) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setImportantQuestions(null);
    setSources(null);

    try {
      const { questions, sources } = await searchBoardQuestions(board, chapter, studentClass);
      
      if (questions.length === 0) {
        setError(`"${chapter}" এর জন্য ${board} (${studentClass})-এ কোনো প্রশ্ন পাওয়া যায়নি।`);
      } else {
        setResults([{ url: `${board} ${studentClass} (Last 10 Years)`, questions }]);
        setSources(sources);
        
        // Automatically trigger important questions generation
        handleGenerateImportant();

        // Add to history
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          chapter: `${chapter} (${board} - ${studentClass})`,
          studentClass,
          urls: [`AI Search: ${board} ${studentClass}`],
          results: [{ url: `${board} ${studentClass} (Last 10 Years)`, questions }],
          timestamp: Date.now(),
        };
        setHistory(prev => [newItem, ...prev].slice(0, 20));
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImportant = async () => {
    if (!chapter) return;
    setLoadingImportant(true);
    try {
      const questions = await generateImportantQuestions(chapter, studentClass);
      setImportantQuestions(questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImportant(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResults(item.results);
    setImportantQuestions(null);
    setChapter(item.chapter);
    setStudentClass(item.studentClass || 'Class 12');
    setUrlsText(item.urls.join('\n'));
    setError(null);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = () => {
    if (!results) return;
    const text = results.map(r => 
      `Source: ${r.url}\n` + 
      r.questions.map(q => `- [${q.difficulty}] (${q.year || 'N/A'}) ${q.text}`).join('\n')
    ).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToPDF = () => {
    window.print();
  };

  const PrintableContent = () => (
    <div className="hidden print:block p-10 bg-white text-slate-950 min-h-screen">
      <div className="text-center border-b-4 border-double border-slate-900 pb-8 mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
            <Layers size={28} />
          </div>
          <span className="font-black text-3xl tracking-tight text-slate-900">PYQ.ai</span>
        </div>
        <h1 className="text-4xl font-black mb-3">{board} • {studentClass}</h1>
        <h2 className="text-2xl font-bold text-slate-700">অধ্যায়: {chapter}</h2>
        <div className="flex justify-center gap-8 mt-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
          <span>তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
          <span>মোট প্রশ্ন: {results?.reduce((acc, r) => acc + r.questions.length, 0) || 0}</span>
        </div>
      </div>

      {importantQuestions && (
        <div className="mb-12 p-8 rounded-3xl border-2 border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-indigo-600" size={24} />
            <h3 className="text-xl font-black text-indigo-900">AI মাস্টারী সাজেশন (Important Questions)</h3>
          </div>
          <div className="space-y-8">
            {importantQuestions.map((q, qIdx) => (
              <div key={qIdx} className="flex gap-4">
                <span className="font-mono text-lg font-bold text-indigo-300">{qIdx + 1}.</span>
                <div className="space-y-2">
                  <p className="text-lg leading-relaxed text-slate-800 font-medium">{q.text}</p>
                  <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    <span>Difficulty: {q.difficulty}</span>
                    <span>Type: Concept Focused</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-12">
        {results?.map((res, idx) => (
          <div key={idx} className="break-inside-avoid">
            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
              <LinkIcon size={16} className="text-slate-400" />
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest truncate">সোর্স: {res.url}</h4>
            </div>
            <div className="space-y-10">
              {res.questions.map((q, qIdx) => (
                <div key={qIdx} className="flex gap-6 break-inside-avoid">
                  <span className="font-mono text-xl font-bold text-slate-200">{qIdx + 1}.</span>
                  <div className="space-y-3">
                    <p className="text-xl leading-relaxed text-slate-900 font-medium">{q.text}</p>
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Difficulty: {q.difficulty}</span>
                      {q.year && <span>Year: {q.year}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-20 pt-10 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Generated by PYQ.ai • Your Intelligent Study Companion
        </p>
      </div>
    </div>
  );

  const exportToWord = () => {
    if (!results) return;
    
    let content = `<html><body><h1>Questions for ${chapter}</h1>`;
    results.forEach(r => {
      content += `<h2>Source: ${r.url}</h2><ul>`;
      r.questions.forEach(q => {
        content += `<li><strong>[${q.difficulty}] ${q.year ? `(${q.year})` : ''}</strong> ${q.text}</li>`;
      });
      content += `</ul>`;
    });
    content += `</body></html>`;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chapter.replace(/\s+/g, '_')}_PYQs.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-[#1E293B]'} font-sans selection:bg-indigo-100`}>
      <PrintableContent />
      {/* Sidebar - Desktop Only */}
      <aside className={`fixed left-0 top-0 h-full w-72 border-r hidden lg:flex flex-col p-6 z-20 transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Layers size={22} />
          </div>
          <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-900'}`}>PYQ.ai</span>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 px-2">
            <HistoryIcon size={16} className="text-indigo-500" />
            <span className="text-sm font-bold uppercase tracking-wider opacity-60">ইতিহাস (History)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-8 opacity-40 italic text-sm">এখনও কোনো ইতিহাস নেই</div>
            ) : (
              history.map(item => (
                <div 
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className={`group relative w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                    darkMode 
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-indigo-500/50' 
                    : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm truncate">{item.chapter}</span>
                    <div className="flex items-center gap-2 opacity-50 text-[10px]">
                      <Clock size={10} />
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.studentClass || 'Class 12'}</span>
                      <span>•</span>
                      <span>{item.urls.length} টি লিঙ্ক</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteHistoryItem(item.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className={`p-4 rounded-2xl transition-colors duration-300 ${darkMode ? 'bg-slate-800' : 'bg-slate-900'} text-white`}>
            <p className="text-xs font-medium opacity-60 mb-2 uppercase tracking-wider">প্রো প্ল্যান</p>
            <p className="text-sm font-semibold mb-3">আনলিমিটেড এক্সট্রাকশন</p>
            <button className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold transition-all">
              এখনই আপগ্রেড করুন
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Header */}
        <header className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-200'} print:hidden`}>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Layers size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">PYQ.ai</span>
          </div>
          
          <div className="hidden lg:block text-sm font-medium opacity-50">
            স্বাগতম, <span className="text-indigo-500">শিক্ষার্থী</span>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
          {/* Hero Header */}
          <div className="mb-10 print:hidden">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4"
            >
              <Sparkles size={12} />
              <span>আধুনিক স্টাডি টুল</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-900'}`}
            >
              মুহূর্তেই খুঁজে নিন আপনার <span className="text-indigo-600">অধ্যায়ভিত্তিক PYQ।</span>
            </motion.h1>
            
            {/* Mode Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mb-8">
              <button
                onClick={() => setSearchMode('link')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  searchMode === 'link'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LinkIcon size={16} />
                লিঙ্ক এক্সট্রাকশন
              </button>
              <button
                onClick={() => setSearchMode('ai')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  searchMode === 'ai'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Globe size={16} />
                AI সার্চ (১০ বছরের PYQ)
              </button>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl"
            >
              আপনার প্রশ্নপত্রের লিঙ্কগুলো এখানে দিন এবং আমাদের AI-কে কাজ করতে দিন। আমরা সব সোর্স থেকে আপনার নির্দিষ্ট অধ্যায়ের প্রতিটি প্রশ্ন খুঁজে বের করব।
            </motion.p>
          </div>

          {/* App Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors duration-300 print:hidden ${darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
          >
            <div className="p-8 lg:p-10">
              {searchMode === 'link' ? (
                <form onSubmit={handleExtract} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* URL Input - Full Width */}
                    <div className="md:col-span-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <LinkIcon size={16} className="text-indigo-500" />
                          সোর্স লিঙ্ক (Source Links)
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">প্রতি লাইনে একটি লিঙ্ক</span>
                      </div>
                      <div className="relative group">
                        <textarea
                          required
                          rows={4}
                          placeholder="https://example.com/paper-2024&#10;https://example.com/paper-2023"
                          className={`w-full px-5 py-4 rounded-2xl border transition-all placeholder:text-slate-300 text-sm font-medium resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                            darkMode 
                            ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                          }`}
                          value={urlsText}
                          onChange={(e) => setUrlsText(e.target.value)}
                        />
                        <div className="absolute right-4 bottom-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              onClick={() => setUrlsText('')}
                              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-400 hover:text-red-400' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Class Selection */}
                    <div className="space-y-3">
                      <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <GraduationCap size={16} className="text-indigo-500" />
                        ক্লাস (Class)
                      </label>
                      <select
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                          darkMode 
                          ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option value="Class 10">Class 10 (Madhyamik)</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12 (HS)</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 8">Class 8</option>
                      </select>
                    </div>

                    {/* Chapter Input */}
                    <div className="md:col-span-2 space-y-3">
                      <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <BookOpen size={16} className="text-indigo-500" />
                        টার্গেট অধ্যায় (Target Chapter)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="যেমন: কোয়ান্টাম মেকানিক্স"
                          className={`w-full px-5 py-4 rounded-2xl border transition-all placeholder:text-slate-300 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                            darkMode 
                            ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                          }`}
                          value={chapter}
                          onChange={(e) => setChapter(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                          <Search size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !urlsText || !chapter}
                    className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex flex-col items-center justify-center gap-1 group active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Loader2 className="animate-spin" size={22} />
                          <span className="tracking-wide">বিশ্লেষণ করা হচ্ছে...</span>
                        </div>
                        <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">
                          লিঙ্ক স্ক্যান হচ্ছে: {progress.current} / {progress.total}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Search size={22} className="group-hover:scale-110 transition-transform" />
                        <span className="tracking-wide text-lg">অধ্যায়ের প্রশ্নগুলো খুঁজুন</span>
                      </div>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAISearch} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Board Selection */}
                    <div className="space-y-3">
                      <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <GraduationCap size={16} className="text-indigo-500" />
                        বোর্ড (Board)
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                          darkMode 
                          ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option value="West Bengal Board">West Bengal Board (WBBSE/WBCHSE)</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE/ISC">ICSE/ISC</option>
                        <option value="Maharashtra Board">Maharashtra Board</option>
                        <option value="UP Board">UP Board</option>
                        <option value="Bihar Board">Bihar Board</option>
                        <option value="Karnataka Board">Karnataka Board</option>
                        <option value="Tamil Nadu Board">Tamil Nadu Board</option>
                        <option value="Kerala Board">Kerala Board</option>
                      </select>
                    </div>

                    {/* Class Selection */}
                    <div className="space-y-3">
                      <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <GraduationCap size={16} className="text-indigo-500" />
                        ক্লাস (Class)
                      </label>
                      <select
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        className={`w-full px-5 py-4 rounded-2xl border transition-all text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                          darkMode 
                          ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option value="Class 10">Class 10 (Madhyamik)</option>
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12 (HS)</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 8">Class 8</option>
                      </select>
                    </div>

                    {/* Chapter Input */}
                    <div className="space-y-3">
                      <label className={`text-sm font-bold flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <BookOpen size={16} className="text-indigo-500" />
                        টার্গেট অধ্যায় (Target Chapter)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="যেমন: কোয়ান্টাম মেকানিক্স"
                          className={`w-full px-5 py-4 rounded-2xl border transition-all placeholder:text-slate-300 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 ${
                            darkMode 
                            ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                          }`}
                          value={chapter}
                          onChange={(e) => setChapter(e.target.value)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                          <Search size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !chapter || !board}
                    className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex flex-col items-center justify-center gap-1 group active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" size={22} />
                        <span className="tracking-wide">AI সার্চ করছে (১০ বছরের PYQ)...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Globe size={22} className="group-hover:scale-110 transition-transform" />
                        <span className="tracking-wide text-lg">১০ বছরের PYQ খুঁজুন</span>
                      </div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Results Area */}
          <div className="mt-12" ref={resultsRef}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex items-start gap-4 text-red-700 dark:text-red-400 print:hidden"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Extraction Failed</h3>
                    <p className="text-sm opacity-80 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-2 print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <h3 className={`font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-900'}`}>ফলাফল প্রস্তুত</h3>
                        <p className="text-xs text-slate-500 font-medium">এর জন্য পাওয়া গেছে: <span className="text-indigo-600 uppercase tracking-wider">{chapter}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                          copied 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                          : darkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
                      </button>
                      <button 
                        onClick={exportToPDF}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                          darkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <FileDown size={16} />
                        পিডিএফ (PDF)
                      </button>
                      <button 
                        onClick={exportToWord}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                          darkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <FileText size={16} />
                        ওয়ার্ড (Word)
                      </button>
                    </div>
                  </div>

                  {!importantQuestions && !loadingImportant && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={handleGenerateImportant}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed transition-all font-bold text-sm ${
                          darkMode
                          ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300'
                        }`}
                      >
                        <Sparkles size={18} />
                        গুরুত্বপূর্ণ প্রশ্ন তৈরি করুন (যা PYQ-তে নেই)
                      </button>
                    </div>
                  )}

                  {loadingImportant && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                      <p className="text-sm font-bold animate-pulse">গুরুত্বপূর্ণ প্রশ্ন তৈরি হচ্ছে...</p>
                    </div>
                  )}

                  {importantQuestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-[2rem] shadow-2xl border-2 overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-slate-900 border-indigo-500/30 shadow-indigo-900/20' : 'bg-white border-indigo-100 shadow-indigo-100/50'}`}
                    >
                      <div className="p-6 lg:p-8 border-b border-indigo-50 dark:border-indigo-900/30 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <h3 className={`text-xl font-black tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI মাস্টারী সাজেশন</h3>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">PYQ-এর বাইরে গুরুত্বপূর্ণ প্রশ্নাবলী</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">৫ টি প্রশ্ন</span>
                          <span className="text-[9px] opacity-40 font-bold">Concept Focused</span>
                        </div>
                      </div>
                      <div className="p-6 lg:p-10 space-y-12">
                        {importantQuestions.map((q, qIdx) => (
                          <QuestionItem key={qIdx} question={q} index={qIdx} darkMode={darkMode} />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-8">
                    {results.map((res, idx) => (
                      <div key={idx} className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                        <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <LinkIcon size={16} className="text-indigo-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-400 truncate max-w-md">{res.url}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest shrink-0">{res.questions.length} টি প্রশ্ন</span>
                        </div>
                        <div className="p-6 lg:p-10 space-y-10">
                          {res.questions.map((q, qIdx) => (
                            <QuestionItem key={qIdx} question={q} index={qIdx} darkMode={darkMode} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {sources && sources.length > 0 && (
                    <div className={`p-8 rounded-[2rem] border transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Globe size={18} className="text-indigo-500" />
                        <h4 className="font-bold text-sm">AI সার্চ সোর্স (Sources)</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((source, sIdx) => (
                          <a 
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2 ${
                              darkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                            }`}
                          >
                            <ExternalLink size={10} />
                            {source.title || 'Source'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-4 print:hidden">
                    <button 
                      onClick={() => { setUrlsText(''); setChapter(''); setResults(null); }}
                      className="px-6 py-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-all text-sm font-bold"
                    >
                      সব মুছে নতুন করে শুরু করুন <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Features Grid */}
          {!loading && !results && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 print:hidden">
              {[
                { 
                  title: "সম্পূর্ণ বাংলা ভার্সন", 
                  desc: "প্রশ্ন নিষ্কাশন, ইঙ্গিত এবং ধাপে ধাপে সমাধান—সবই এখন আপনার মাতৃভাষা বাংলায়।",
                  icon: <BookOpen className="text-indigo-500" size={20} />
                },
                { 
                  title: "১০ বছরের AI সার্চ", 
                  desc: "লিঙ্ক ছাড়াই যেকোনো বোর্ডের গত ১০ বছরের প্রশ্ন সরাসরি ইন্টারনেট থেকে খুঁজে বের করুন।",
                  icon: <Globe className="text-indigo-500" size={20} />
                },
                { 
                  title: "AI মাস্টারী সাজেশন", 
                  desc: "PYQ-এর বাইরেও অধ্যায়ের গুরুত্বপূর্ণ ৫টি প্রশ্ন যা আপনার কনসেপ্ট আরও মজবুত করবে।",
                  icon: <Sparkles className="text-amber-500" size={20} />
                },
                { 
                  title: "মাল্টি-সোর্স এক্সট্রাকশন", 
                  desc: "একসাথে ১০টি পর্যন্ত লিঙ্ক স্ক্যান করে আপনার প্রয়োজনীয় প্রশ্নগুলো খুঁজে বের করুন।",
                  icon: <Layers className="text-indigo-500" size={20} />
                },
                { 
                  title: "স্মার্ট ফিল্টারিং", 
                  desc: "AI স্বয়ংক্রিয়ভাবে আপনার পছন্দের অধ্যায়ের প্রশ্নগুলো নির্ভুলভাবে শনাক্ত করে।",
                  icon: <Search className="text-slate-500" size={20} />
                },
                { 
                  title: "এক্সপোর্ট ও অফলাইন স্টাডি", 
                  desc: "আপনার সংগৃহীত প্রশ্নগুলো PDF বা Word ফাইল হিসেবে সেভ করে অফলাইনে পড়ার সুবিধা।",
                  icon: <FileDown className="text-rose-500" size={20} />
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className={`p-8 rounded-[2rem] border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    {feature.icon}
                  </div>
                  <h3 className={`font-bold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className={`max-w-4xl mx-auto px-6 lg:px-12 py-12 border-t text-center transition-colors duration-300 print:hidden ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
            <Layers size={16} />
            <span className="font-bold tracking-tight">PYQ.ai</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            © ২০২৬ PYQ.ai • নতুন প্রজন্মের শিক্ষার্থীদের জন্য তৈরি
          </p>
        </footer>
      </main>

      <style>{`
        @media print {
          aside, header, footer, .print\\:hidden, button, form, .lg\\:pl-72 {
            display: none !important;
          }
          main {
            padding-left: 0 !important;
            margin: 0 !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .rounded-\\[2rem\\], .rounded-3xl, .rounded-2xl {
            border-radius: 0 !important;
            box-shadow: none !important;
            border-color: #e2e8f0 !important;
          }
          .bg-indigo-50\\/30 {
            background-color: #f8fafc !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
}



