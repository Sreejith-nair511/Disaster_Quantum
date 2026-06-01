"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

// Resolve API base robustly: when page is loaded via file:// or localhost dev, point to backend at 127.0.0.1:8000
const resolveApiBase = () => {
  if (typeof window === 'undefined') return '';
  try {
    const { protocol, hostname } = window.location;
    if (protocol === 'file:') return 'http://127.0.0.1:8000';
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://127.0.0.1:8000';
    // otherwise assume same origin and use relative paths
    return '';
  } catch (e) {
    return 'http://127.0.0.1:8000';
  }
};

const API_BASE = resolveApiBase();

const LANG_OPTIONS = [
  { code: 'hi-IN', label: 'Hindi (hi-IN)' },
  { code: 'ta-IN', label: 'Tamil (ta-IN)' },
  { code: 'kn-IN', label: 'Kannada (kn-IN)' },
  { code: 'en-IN', label: 'English (en-IN)' }
];

export default function SpeechPanel() {
  const [lang, setLang] = useState('hi-IN');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speakText, setSpeakText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[] | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [autoInterpret, setAutoInterpret] = useState(true);

  useEffect(() => {
    // load available voices
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v || null);
      if (v && v.length > 0) setSelectedVoice((prev) => prev ?? v[0].name);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // STT using Web Speech API (client-side)
  const handleStartStop = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('SpeechRecognition API not supported in this browser. Use Chrome/Edge.');
      return;
    }

    // @ts-ignore
    const recog = new SpeechRecognition();
    recog.lang = lang;
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    if (!listening) {
      setTranscript('');
      recog.start();
      setListening(true);
      setStatus('listening');
    }

    recog.onresult = (ev: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript((prev) => (final ? prev + ' ' + final : interim));
      if (final && autoInterpret) {
        // process final transcript for intent
        interpretIntent(final.trim());
      }
    };

    recog.onerror = (e: any) => {
      console.error('STT error', e);
      setListening(false);
      setStatus('idle');
      try { recog.stop(); } catch (e) {}
    };

    recog.onend = () => {
      setListening(false);
      setStatus('idle');
    };
  };

  // Basic keyword-based intent detection
  const interpretIntent = async (text: string) => {
    const t = text.toLowerCase();
    const mapping: { [k: string]: string } = {
      flood: 'flood',
      floods: 'flood',
      "flooding": 'flood',
      cyclone: 'cyclone',
      cyclone: 'cyclone',
      earthquake: 'earthquake',
      quake: 'earthquake',
      landslide: 'landslide',
      landslides: 'landslide',
      fire: 'wildfire',
      wildfire: 'wildfire',
      heat: 'heatwave',
      heatwave: 'heatwave',
      cloudburst: 'cloudburst'
    };

    // simple multilingual hints (Hindi/Tamil/Kannada transliterations/words)
    const multilingual: { [k: string]: string[] } = {
      flood: ['बाढ़', 'baadh', 'பெரிய மழை', 'maḻai', 'ಮಳೆ', 'male'],
      earthquake: ['भूकंप', 'bhukamp', 'bhukamp', 'நிலச்சரிவு', 'ಭೂಕಂಪ'],
      landslide: ['भूस्खलन', 'भूस्खलन', 'மண்ணழிவு', 'ಮಣ್ಣೆಲುಗು'],
      cyclone: ['चक्रवात', 'cyc', 'சைக்கிளோன்', 'ತોફಾನ್'],
      wildfire: ['आग', 'wildfire', 'காட்டாம conflagration', 'ಅಗ್ನಿಯಲ್ಲಿ']
    };

    // check English keywords
    for (const k of Object.keys(mapping)) {
      if (t.includes(k)) {
        await triggerHazard(mapping[k], text);
        return;
      }
    }

    // check multilingual simple tokens
    for (const hazard of Object.keys(multilingual)) {
      for (const token of multilingual[hazard]) {
        if (token && t.includes(token)) {
          await triggerHazard(hazard, text);
          return;
        }
      }
    }

    // Common urgent phrases => call emergency number
    if (t.includes('please help') || t.includes('help me') || t.includes('ambulance') || t.includes('call 108') || t.includes('dial 108') || t.includes('108')) {
      // route to backend intent to dial 108
      try {
        setSystemMessage('Interpreted emergency request — calling 108 (simulated)...');
        const url = API_BASE ? `${API_BASE}/api/intent` : '/api/intent';
        const resp = await axios.post(url, { text: text, intent: 'dial_108', metadata: { source: 'stt' } }, { timeout: 8000 });
        const msg = resp.data && resp.data.message ? resp.data.message : 'Dialed 108 (simulated)';
        setSystemMessage(msg);
        handleSpeak(msg);
      } catch (err) {
        console.error('Dial 108 failed', err);
        setSystemMessage('Failed to place emergency call');
        handleSpeak('Failed to place emergency call');
      }
      return;
    }

    // Activate system modules
    if (t.includes('quantum') || t.includes('activate quantum') || t.includes('activate quantum module') || t.includes('run optimizer')) {
      try {
        setSystemMessage('Activating quantum optimizer module (simulated)...');
        const url = API_BASE ? `${API_BASE}/api/intent` : '/api/intent';
        const resp = await axios.post(url, { text: text, intent: 'activate_quantum_module', metadata: { source: 'stt' } }, { timeout: 8000 });
        const msg = resp.data && resp.data.message ? resp.data.message : 'Quantum module activated (simulated)';
        setSystemMessage(msg);
        handleSpeak(msg);
      } catch (err) {
        console.error('Activate quantum failed', err);
        setSystemMessage('Failed to activate module');
        handleSpeak('Failed to activate module');
      }
      return;
    }
  };

  const triggerHazard = async (hazardType: string, sourceText?: string) => {
    // now routed through /api/intent for logging and central action handling
    try {
      setSystemMessage(`Interpreted: ${hazardType}. Triggering response...`);
      const url = API_BASE ? `${API_BASE}/api/intent` : '/api/intent';
      const resp = await axios.post(url, {
        text: sourceText || hazardType,
        intent: 'trigger_hazard',
        metadata: { hazard_type: hazardType }
      }, { timeout: 8000 });

      const msg = resp.data && resp.data.message ? resp.data.message : `Triggered ${hazardType}`;
      setSystemMessage(msg);
      handleSpeak(msg);
    } catch (err) {
      console.error('Trigger hazard failed', err);
      setSystemMessage('Failed to trigger alert — see console');
      handleSpeak('Failed to trigger alert');
    }
  };

  const handleSpeak = (text?: string) => {
    const toSpeak = text ?? speakText ?? transcript;
    if (!toSpeak) return;
    const ut = new SpeechSynthesisUtterance(toSpeak);
    ut.lang = lang;
    if (voices && selectedVoice) {
      const v = voices.find((x) => x.name === selectedVoice);
      if (v) ut.voice = v;
    }
    window.speechSynthesis.cancel();
    setStatus('speaking');
    ut.onend = () => setStatus('idle');
    window.speechSynthesis.speak(ut);
  };

  return (
    <div className="glass-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-200">Speech — STT / TTS</h4>
        <span className="text-[10px] text-slate-400 font-mono">Client-side (Web Speech)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label htmlFor="speech-lang" className="text-xs text-slate-400 font-mono block mb-1">Language</label>
          <select
            id="speech-lang"
            title="Choose speech language"
            aria-label="Speech language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
          >
            {LANG_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex gap-2 items-end">
          <button
            onClick={handleStartStop}
            className={`px-3 py-1 rounded text-sm font-mono ${listening ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200'}`}
          >
            {listening ? 'Listening — Click to stop' : 'Start STT'}
          </button>
          <button
            onClick={() => handleSpeak()}
            className="px-3 py-1 rounded bg-cyan-700 text-white text-sm font-mono"
          >
            Speak Transcript
          </button>
          <div className="ml-2 text-xs font-mono text-slate-400">
            <span className={`inline-block px-2 py-0.5 rounded ${status === 'listening' ? 'bg-rose-600 text-white' : status === 'speaking' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{status.toUpperCase()}</span>
            <div aria-live="polite" className="sr-only">Speech status: {status}</div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="speech-transcript" className="text-xs text-slate-400 font-mono">Transcript</label>
        <textarea id="speech-transcript" value={transcript} readOnly rows={3} placeholder="Speech transcript will appear here" className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 font-mono" />
      </div>

      <div className="mb-3">
        <label className="text-xs text-slate-400 font-mono">Text to speak</label>
        <div className="flex gap-2 mt-1">
          <input id="speech-text" title="Type text to synthesize" value={speakText} onChange={(e) => setSpeakText(e.target.value)} placeholder="Type text to synthesize" className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 font-mono" />
          <select
            id="speech-voice"
            title="Choose voice"
            aria-label="Voice"
            value={selectedVoice ?? ''}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded text-sm max-w-[220px] truncate"
          >
            {voices && voices.length > 0 ? (
              voices.map((v) => <option key={v.name} value={v.name} title={`${v.name} — ${v.lang}`}>{v.name} — {v.lang}</option>)
            ) : (
              <option value="">(No voices available)</option>
            )}
          </select>
          <button onClick={() => handleSpeak(undefined)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm font-mono">Speak</button>
        </div>
      </div>

      <div className="text-xs text-slate-500 font-mono">Notes: Uses browser Web Speech APIs. For server-side STT/TTS add provider keys and enable server adapters.</div>
    </div>
  );
}
