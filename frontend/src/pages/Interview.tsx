import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video, VideoOff, Clock, X,
  Phone, User, CalendarDays, Timer,
  Mic, MicOff, MonitorUp, Hand, MoreVertical,
  MessageSquare, Users, Send, Copy, Check, Shield,
  Maximize, Minimize, Pin, PinOff, ScreenShareOff,
  Disc, PictureInPicture2, Keyboard, Smile,
  Volume2, VolumeX, Aperture, Pencil, StickyNote,
  BarChart2, HelpCircle, Image, Sun, Sparkles,
  Lock, ClipboardList, Eraser
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';

type InterviewStatus = 'upcoming' | 'completed' | 'cancelled';
type InterviewType = 'video' | 'phone' | 'in-person';

interface InterviewData {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
  status: InterviewStatus;
  round: string;
  interviewer?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

const sampleInterviews: InterviewData[] = [
  {
    id: '1',
    jobTitle: 'Frontend Developer',
    company: 'TechNova Solutions',
    date: '2026-04-05',
    time: '10:00 AM',
    duration: '45 min',
    type: 'video',
    status: 'upcoming',
    round: 'Technical Round 1',
    interviewer: 'Priya Sharma',
    meetingLink: '#',
    notes: 'Focus on React, TypeScript, and system design questions.',
  },
  {
    id: '2',
    jobTitle: 'Full Stack Developer',
    company: 'InnovateTech',
    date: '2026-04-08',
    time: '2:00 PM',
    duration: '60 min',
    type: 'video',
    status: 'upcoming',
    round: 'HR Round',
    interviewer: 'Rahul Verma',
    meetingLink: '#',
    notes: 'Behavioral questions and salary discussion.',
  },
  {
    id: '3',
    jobTitle: 'Backend Developer',
    company: 'CloudStack India',
    date: '2026-03-28',
    time: '11:30 AM',
    duration: '45 min',
    type: 'phone',
    status: 'completed',
    round: 'Screening Round',
    interviewer: 'Amit Patel',
    notes: 'Discussed Node.js experience and past projects.',
  },
  {
    id: '4',
    jobTitle: 'Data Science Intern',
    company: 'AnalytiQ Labs',
    date: '2026-03-25',
    time: '3:00 PM',
    duration: '30 min',
    type: 'video',
    status: 'completed',
    round: 'Technical Round 1',
    interviewer: 'Dr. Meena Iyer',
    notes: 'Python coding test and ML concepts discussion.',
  },
  {
    id: '5',
    jobTitle: 'UI/UX Designer',
    company: 'PixelCraft Studio',
    date: '2026-04-02',
    time: '4:00 PM',
    duration: '45 min',
    type: 'in-person',
    status: 'cancelled',
    round: 'Portfolio Review',
    interviewer: 'Sneha Gupta',
    location: 'PixelCraft Office, Andheri West, Mumbai',
    notes: 'Cancelled due to scheduling conflict. Will be rescheduled.',
  },
  {
    id: '6',
    jobTitle: 'DevOps Engineer',
    company: 'ScaleUp Systems',
    date: '2026-04-10',
    time: '11:00 AM',
    duration: '60 min',
    type: 'video',
    status: 'upcoming',
    round: 'Technical Round 2',
    interviewer: 'Karthik Nair',
    meetingLink: '#',
    notes: 'AWS architecture, Docker, Kubernetes deep dive.',
  },
  {
    id: '7',
    jobTitle: 'Mobile App Developer',
    company: 'AppCraft Technologies',
    date: '2026-03-20',
    time: '10:00 AM',
    duration: '45 min',
    type: 'video',
    status: 'completed',
    round: 'Final Round',
    interviewer: 'Vikram Singh',
    notes: 'React Native live coding. Offer extended.',
  },
];

/* ========== Meeting Component ========== */

function MeetingRoom({ interview, onLeave }: { interview: InterviewData; onLeave: () => void }) {
  const { user } = useAuth();
  const interviewerName = interview.interviewer || 'Interviewer';
  const userName = user?.name || 'You';

  const [isLobby, setIsLobby] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [meetingTime, setMeetingTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [bgBlur, setBgBlur] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activePanel, setActivePanel] = useState<'chat' | 'people' | 'notes' | 'polls' | 'qa' | 'whiteboard' | null>(null);
  const [showVirtualBg, setShowVirtualBg] = useState(false);
  const [selectedBg, setSelectedBg] = useState('none');
  const [lowLightMode, setLowLightMode] = useState(false);
  const [videoFilter, setVideoFilter] = useState('none');
  const [meetingLocked, setMeetingLocked] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState<{ name: string; time: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [polls, setPolls] = useState<{ question: string; options: string[]; votes: number[]; voted: boolean }[]>([
    { question: 'How would you rate this interview?', options: ['Excellent', 'Good', 'Average', 'Poor'], votes: [0, 0, 0, 0], voted: false },
  ]);
  const [qaQuestions, setQaQuestions] = useState<{ id: number; text: string; from: string; answered: boolean; answer?: string }[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [whiteboardLines, setWhiteboardLines] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboardColor, setWhiteboardColor] = useState('#ffffff');
  const [captionText, setCaptionText] = useState('');
  const [captionLang, setCaptionLang] = useState('en-US');
  const recognitionRef = useRef<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micLevelFrameRef = useRef<number>(0);

  // Mic level analyzer
  const startMicLevelAnalyzer = useCallback((stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, Math.round(avg * 1.5)));
        micLevelFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* no audio context support */ }
  }, []);

  // Emoji reaction
  const sendReaction = (emoji: string) => {
    const id = Date.now();
    const x = 20 + Math.random() * 60;
    setReactions(prev => [...prev, { id, emoji, x }]);
    setShowReactionPicker(false);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
  };

  // Toast notification
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }, []);

  // PiP mode
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (localVideoRef.current) {
        await localVideoRef.current.requestPictureInPicture();
      }
    } catch { showToast('Picture-in-Picture not supported'); }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLobby || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.ctrlKey && e.key === 'd') { e.preventDefault(); toggleMic(); }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); toggleCamera(); }
      if (e.ctrlKey && e.key === 'h') { e.preventDefault(); setIsHandRaised(p => !p); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Panel toggle helper
  const openPanel = (panel: typeof activePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  // Simulate waiting room
  useEffect(() => {
    if (!isLobby) {
      const t = setTimeout(() => {
        setWaitingRoom([{ name: 'HR Manager', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        showToast('Someone is waiting to join');
      }, 15000);
      return () => clearTimeout(t);
    }
  }, [isLobby, showToast]);

  // Whiteboard drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    setWhiteboardLines(prev => [...prev, [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]]);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setWhiteboardLines(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = [...copy[copy.length - 1], point];
      return copy;
    });
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const line = whiteboardLines[whiteboardLines.length - 1];
      if (line && line.length > 0) {
        ctx.strokeStyle = whiteboardColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(line[line.length - 1].x, line[line.length - 1].y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }
  };
  const stopDraw = () => setIsDrawing(false);
  const clearWhiteboard = () => {
    setWhiteboardLines([]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Video filter style
  const videoFilterStyle = (): React.CSSProperties => {
    const filters: string[] = [];
    if (bgBlur) filters.push('contrast(1.02)');
    if (lowLightMode) filters.push('brightness(1.4)');
    if (videoFilter === 'grayscale') filters.push('grayscale(1)');
    if (videoFilter === 'sepia') filters.push('sepia(0.8)');
    if (videoFilter === 'warm') filters.push('sepia(0.3) saturate(1.4)');
    if (videoFilter === 'cool') filters.push('hue-rotate(30deg) saturate(1.2)');
    if (videoFilter === 'vintage') filters.push('sepia(0.5) contrast(1.1) brightness(0.9)');
    return filters.length ? { filter: filters.join(' ') } : {};
  };

  // Live speech-to-text captions
  const captionsActiveRef = useRef(false);

  const stopCaptions = useCallback(() => {
    captionsActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setCaptionText('');
  }, []);

  const startCaptions = useCallback(() => {
    stopCaptions();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showToast('Speech recognition not supported. Use Chrome browser.');
      return;
    }
    captionsActiveRef.current = true;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = captionLang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setCaptionText(text);
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        showToast('Microphone permission denied for captions');
        captionsActiveRef.current = false;
      }
    };

    recognition.onend = () => {
      // Auto-restart if captions are still active
      if (captionsActiveRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      showToast('Live captions turned on');
    } catch {
      showToast('Failed to start captions');
    }
  }, [captionLang, showToast, stopCaptions]);

  // Start/stop captions when toggled
  useEffect(() => {
    if (showCaptions && !isLobby) {
      startCaptions();
    } else {
      stopCaptions();
    }
    return () => stopCaptions();
  }, [showCaptions, isLobby, startCaptions, stopCaptions]);

  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      // Attach to video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      setIsCameraOn(true);
      setIsMicOn(true);
      setMediaError('');
      startMicLevelAnalyzer(stream);
    } catch {
      setMediaError('Could not access camera or microphone. Please allow permissions and try again.');
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  }, []);

  const stopAllStreams = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (micLevelFrameRef.current) cancelAnimationFrame(micLevelFrameRef.current);
    audioCtxRef.current?.close();
  }, []);

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOn(track.enabled); }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
        stream.getVideoTracks()[0].onended = () => { setIsScreenSharing(false); screenStreamRef.current = null; };
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    }
  };

  const endCall = () => {
    stopAllStreams();
    if (timerRef.current) clearInterval(timerRef.current);
    setShowEndScreen(true);
  };

  const joinMeeting = () => {
    setIsLobby(false);
    timerRef.current = setInterval(() => setMeetingTime(t => t + 1), 1000);
    setTimeout(() => showToast(`${interviewerName} is in the meeting`), 1500);
  };

  // Re-attach stream to video element when lobby/call view changes
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isLobby]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), sender: userName, text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isMe: true,
    }]);
    const input = chatInput.trim();
    setChatInput('');
    setTimeout(() => {
      const lower = input.toLowerCase();
      let reply = 'Thanks for the message. Let\'s continue.';
      if (lower.includes('hello') || lower.includes('hi')) reply = 'Hello! Great to have you. Shall we begin?';
      else if (lower.includes('ready')) reply = 'Perfect, let\'s get started.';
      else if (lower.includes('thank')) reply = 'You\'re welcome! Good luck!';
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: interviewerName, text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isMe: false,
      }]);
    }, 2000 + Math.random() * 2000);
  };

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  // Auto-start camera when entering lobby
  useEffect(() => { startCamera(); }, [startCamera]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { return () => { stopAllStreams(); if (timerRef.current) clearInterval(timerRef.current); }; }, [stopAllStreams]);
  useEffect(() => { if (isMoreOpen) { const c = () => setIsMoreOpen(false); document.addEventListener('click', c); return () => document.removeEventListener('click', c); } }, [isMoreOpen]);

  const AvatarCircle = ({ name, size = 'h-24 w-24', text = 'text-4xl', color = 'bg-teal-600' }: { name: string; size?: string; text?: string; color?: string }) => (
    <div className={`${size} rounded-full ${color} flex items-center justify-center`}><span className={`text-white ${text} font-semibold`}>{name[0].toUpperCase()}</span></div>
  );

  /* --- Lobby --- */
  if (isLobby) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#202124] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="relative">
            <div className="relative aspect-video bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl">
              <video ref={localVideoRef} autoPlay playsInline muted style={videoFilterStyle()} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
              {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={userName} color="bg-indigo-600" /></div>}
              {mediaError && <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4"><p className="text-red-400 text-sm text-center">{mediaError}</p></div>}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button onClick={toggleMic}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isMicOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button onClick={toggleCamera}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isCameraOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-white mb-2">Ready to join?</h1>
            <p className="text-[#9aa0a6] text-sm mb-1">{interview.jobTitle} - {interview.round}</p>
            <p className="text-[#9aa0a6] text-sm mb-6">{interview.company}</p>
            <button onClick={joinMeeting} className="w-full lg:w-auto px-8 py-3 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-base font-medium rounded-full transition">Join now</button>
            <div className="mt-4 flex items-center justify-center lg:justify-start gap-3">
              <button onClick={copyLink} className="flex items-center gap-2 text-[#8ab4f8] hover:text-[#aecbfa] text-sm transition">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copied!' : 'Copy meeting link'}
              </button>
            </div>
            <button onClick={onLeave} className="mt-4 text-[#9aa0a6] hover:text-white text-sm transition">Back to interviews</button>
            <div className="mt-6 p-4 rounded-xl bg-[#2d2e31] border border-[#3c4043]">
              <div className="flex items-center gap-3 mb-1"><Shield className="h-4 w-4 text-[#8ab4f8]" /><span className="text-white text-sm font-medium">Secure interview</span></div>
              <p className="text-[#9aa0a6] text-xs">This meeting is private and encrypted.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- In-Call UI --- */
  return (
    <div className="fixed inset-0 z-[60] bg-[#202124] flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Video className="h-4 w-4 text-white" /></div>
          <span className="text-white font-medium text-sm hidden sm:block">{interview.jobTitle}</span>
          <span className="text-[#9aa0a6] text-xs hidden md:block">|</span>
          <span className="text-[#9aa0a6] text-xs hidden md:block">{interview.round}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#9aa0a6] text-sm"><Clock className="h-4 w-4" /><span className="font-mono">{formatTime(meetingTime)}</span></div>
          <button onClick={copyLink} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#8ab4f8] hover:bg-[#3c4043] transition">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 relative p-2 flex items-center justify-center">
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col gap-2">
              <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <MonitorUp className="h-3.5 w-3.5 text-green-400" /><span className="text-white text-xs">You are presenting</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-48 aspect-video bg-[#3c4043] rounded-xl overflow-hidden shadow-2xl border-2 border-[#3c4043] z-10">
                <video ref={localVideoRef} autoPlay playsInline muted style={videoFilterStyle()} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={userName} size="h-12 w-12" text="text-lg" color="bg-indigo-600" /></div>}
                {!isMicOn && <div className="absolute bottom-2 left-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center"><MicOff className="h-3 w-3 text-white" /></div>}
              </div>
            </div>
          ) : layout === 'speaker' ? (
            <div className="w-full h-full flex flex-col gap-2">
              <div className="flex-1 relative bg-[#3c4043] rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={interviewerName} size="h-28 w-28" text="text-5xl" /></div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-white text-sm">{interviewerName}</span><Shield className="h-3 w-3 text-[#8ab4f8]" />
                </div>
              </div>
              <div className={`absolute bottom-4 right-4 ${isPinned ? 'w-72' : 'w-48'} aspect-video bg-[#3c4043] rounded-xl overflow-hidden shadow-2xl border-2 border-[#3c4043] hover:border-[#8ab4f8] transition cursor-pointer z-10`} onClick={() => setIsPinned(!isPinned)}>
                <video ref={localVideoRef} autoPlay playsInline muted style={videoFilterStyle()} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={userName} size="h-12 w-12" text="text-lg" color="bg-indigo-600" /></div>}
                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1"><span className="text-white text-xs">You</span></div>
                {!isMicOn && <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center"><MicOff className="h-3 w-3 text-white" /></div>}
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition">{isPinned ? <PinOff className="h-4 w-4 text-white drop-shadow" /> : <Pin className="h-4 w-4 text-white drop-shadow" />}</div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full grid grid-cols-2 gap-2">
              <div className="relative bg-[#3c4043] rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={interviewerName} /></div>
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"><span className="text-white text-sm">{interviewerName}</span></div>
              </div>
              <div className="relative bg-[#3c4043] rounded-xl overflow-hidden">
                <video ref={localVideoRef} autoPlay playsInline muted style={videoFilterStyle()} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center"><AvatarCircle name={userName} color="bg-indigo-600" /></div>}
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"><span className="text-white text-sm">You</span></div>
                {!isMicOn && <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-red-500 flex items-center justify-center"><MicOff className="h-3.5 w-3.5 text-white" /></div>}
              </div>
            </div>
          )}
          {/* Hand raised */}
          {isHandRaised && <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#fdd663] text-[#202124] px-4 py-2 rounded-full text-sm font-medium shadow-lg z-20"><Hand className="h-4 w-4" />You raised your hand</div>}

          {/* Live Captions */}
          {showCaptions && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 z-20">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                {captionText ? (
                  <p className="text-white text-sm">{captionText}</p>
                ) : (
                  <p className="text-[#9aa0a6] text-sm italic">Listening... speak to see live captions</p>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <select value={captionLang} onChange={(e) => { setCaptionLang(e.target.value); stopCaptions(); setTimeout(() => startCaptions(), 300); }}
                  className="bg-black/60 text-[#9aa0a6] text-xs rounded-full px-3 py-1 border border-[#3c4043] focus:outline-none">
                  <option value="en-US">English</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                  <option value="zh-CN">Chinese</option>
                  <option value="ar-SA">Arabic</option>
                </select>
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-20 animate-pulse">
              <Disc className="h-3.5 w-3.5" />REC
            </div>
          )}

          {/* Floating emoji reactions */}
          {reactions.map(r => (
            <div key={r.id} className="absolute bottom-24 z-30 text-4xl pointer-events-none animate-bounce" style={{ left: `${r.x}%`, animation: 'floatUp 3s ease-out forwards' }}>
              {r.emoji}
            </div>
          ))}
          <style>{`@keyframes floatUp { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-300px); } }`}</style>

          {/* Reaction picker */}
          {showReactionPicker && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#2d2e31] border border-[#3c4043] rounded-full px-3 py-2 shadow-2xl z-30">
              {['👍','👏','😂','😮','❤️','🎉','🤔','👋'].map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl hover:scale-125 transition p-1">{emoji}</button>
              ))}
            </div>
          )}

          {/* Toast notification */}
          {toastMsg && (
            <div className="absolute top-4 right-4 bg-[#2d2e31] border border-[#3c4043] text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl z-30 animate-[slideIn_0.3s_ease-out]">
              {toastMsg}
            </div>
          )}

          {/* Mic level indicator on self-view */}
          {isMicOn && !isScreenSharing && layout === 'speaker' && (
            <div className="absolute bottom-4 right-4 z-20" style={{ marginRight: isPinned ? '0' : '0', marginBottom: '0' }}>
              <div className="absolute -left-3 bottom-2 flex flex-col-reverse gap-0.5 h-12">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1 rounded-full transition-all duration-100 ${micLevel > i * 20 ? 'bg-green-400' : 'bg-[#5f6368]'}`} style={{ height: `${3 + i}px` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {activePanel && (
          <div className="w-80 flex-shrink-0 bg-[#2d2e31] border-l border-[#3c4043] flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#3c4043] flex-shrink-0">
              <span className="text-white text-sm font-medium capitalize">{activePanel === 'qa' ? 'Q&A' : activePanel}</span>
              <button onClick={() => openPanel(null)} className="p-1.5 rounded-full text-[#9aa0a6] hover:bg-[#3c4043] transition"><X className="h-4 w-4" /></button>
            </div>

            {/* Chat Panel */}
            {activePanel === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && <div className="text-center py-8"><MessageSquare className="h-10 w-10 text-[#5f6368] mx-auto mb-3" /><p className="text-[#9aa0a6] text-sm">No messages yet</p></div>}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1"><span className={`text-xs font-medium ${msg.isMe ? 'text-[#8ab4f8]' : 'text-[#e8eaed]'}`}>{msg.sender}</span><span className="text-[#5f6368] text-xs">{msg.time}</span></div>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${msg.isMe ? 'bg-[#1a73e8] text-white rounded-tr-sm' : 'bg-[#3c4043] text-[#e8eaed] rounded-tl-sm'}`}>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-[#3c4043] flex-shrink-0">
                  <div className="flex items-center gap-2 bg-[#3c4043] rounded-full px-4 py-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] focus:outline-none" placeholder="Send a message..." />
                    <button onClick={sendChat} className="text-[#8ab4f8] hover:text-[#aecbfa] transition p-1"><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* People Panel */}
            {activePanel === 'people' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#9aa0a6] text-xs">In this call (2)</span>
                  <button onClick={() => { setMeetingLocked(!meetingLocked); showToast(meetingLocked ? 'Meeting unlocked' : 'Meeting locked'); }} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition ${meetingLocked ? 'bg-red-500/20 text-red-400' : 'text-[#9aa0a6] hover:bg-[#3c4043]'}`}><Lock className="h-3 w-3" />{meetingLocked ? 'Locked' : 'Lock'}</button>
                </div>
                {[{ name: interviewerName, host: true }, { name: userName, host: false }].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#3c4043] transition">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-medium ${p.host ? 'bg-teal-600' : 'bg-indigo-600'}`}>{p.name[0].toUpperCase()}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm">{p.name}</span>
                          {p.host && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#394457] text-[#8ab4f8] font-medium">Host</span>}
                          {!p.host && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#394457] text-[#81c995] font-medium">You</span>}
                        </div>
                      </div>
                    </div>
                    {p.host && <button onClick={() => showToast('Cannot mute host')} className="text-[#9aa0a6] hover:text-white p-1"><MicOff className="h-3.5 w-3.5" /></button>}
                  </div>
                ))}
                {waitingRoom.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#3c4043]">
                    <span className="text-[#9aa0a6] text-xs">Waiting room ({waitingRoom.length})</span>
                    {waitingRoom.map((w, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#3c4043] mt-2">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-600 flex items-center justify-center text-white font-medium">{w.name[0]}</div>
                          <div><span className="text-white text-sm">{w.name}</span><p className="text-[#5f6368] text-xs">{w.time}</p></div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setWaitingRoom([]); showToast(`${w.name} admitted`); }} className="text-xs px-2 py-1 rounded bg-[#1a73e8] text-white hover:bg-[#1765cc]">Admit</button>
                          <button onClick={() => { setWaitingRoom([]); showToast(`${w.name} denied`); }} className="text-xs px-2 py-1 rounded bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]">Deny</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Panel */}
            {activePanel === 'notes' && (
              <div className="flex-1 flex flex-col min-h-0 p-4">
                <p className="text-[#9aa0a6] text-xs mb-3">Meeting notes are saved locally.</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 bg-[#3c4043] text-[#e8eaed] text-sm rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] placeholder:text-[#5f6368]" placeholder="Type your meeting notes here..." />
              </div>
            )}

            {/* Polls Panel */}
            {activePanel === 'polls' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {polls.map((poll, pi) => (
                  <div key={pi} className="bg-[#3c4043] rounded-xl p-4">
                    <p className="text-white text-sm font-medium mb-3">{poll.question}</p>
                    <div className="space-y-2">
                      {poll.options.map((opt, oi) => {
                        const total = poll.votes.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((poll.votes[oi] / total) * 100) : 0;
                        return (
                          <button key={oi} disabled={poll.voted} onClick={() => {
                            setPolls(prev => prev.map((p, i) => i === pi ? { ...p, votes: p.votes.map((v, j) => j === oi ? v + 1 : v), voted: true } : p));
                          }} className="w-full text-left relative overflow-hidden rounded-lg border border-[#5f6368] p-2.5 transition hover:border-[#8ab4f8] disabled:cursor-default">
                            {poll.voted && <div className="absolute inset-y-0 left-0 bg-[#1a73e8]/20 transition-all" style={{ width: `${pct}%` }} />}
                            <div className="relative flex items-center justify-between">
                              <span className="text-[#e8eaed] text-sm">{opt}</span>
                              {poll.voted && <span className="text-[#8ab4f8] text-xs font-medium">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {poll.voted && <p className="text-[#5f6368] text-xs mt-2">{poll.votes.reduce((a, b) => a + b, 0)} votes</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Q&A Panel */}
            {activePanel === 'qa' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {qaQuestions.length === 0 && <div className="text-center py-8"><HelpCircle className="h-10 w-10 text-[#5f6368] mx-auto mb-3" /><p className="text-[#9aa0a6] text-sm">No questions yet</p></div>}
                  {qaQuestions.map(q => (
                    <div key={q.id} className="bg-[#3c4043] rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-[#8ab4f8] text-xs font-medium">{q.from}</span></div>
                      <p className="text-[#e8eaed] text-sm">{q.text}</p>
                      {q.answered && <p className="text-[#81c995] text-xs mt-2">Answered: {q.answer}</p>}
                      {!q.answered && <span className="text-[#fdd663] text-xs mt-1 inline-block">Pending</span>}
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[#3c4043] flex-shrink-0">
                  <div className="flex items-center gap-2 bg-[#3c4043] rounded-full px-4 py-2">
                    <input type="text" value={qaInput} onChange={(e) => setQaInput(e.target.value)} onKeyDown={(e) => {
                      if (e.key === 'Enter' && qaInput.trim()) {
                        setQaQuestions(prev => [...prev, { id: Date.now(), text: qaInput.trim(), from: userName, answered: false }]);
                        setQaInput('');
                        setTimeout(() => setQaQuestions(prev => prev.map((q, i) => i === prev.length - 1 ? { ...q, answered: true, answer: 'Great question! We\'ll discuss this.' } : q)), 3000);
                      }
                    }} className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] focus:outline-none" placeholder="Ask a question..." />
                    <button onClick={() => { if (qaInput.trim()) { setQaQuestions(prev => [...prev, { id: Date.now(), text: qaInput.trim(), from: userName, answered: false }]); setQaInput(''); setTimeout(() => setQaQuestions(prev => prev.map((q, i) => i === prev.length - 1 ? { ...q, answered: true, answer: 'Great question!' } : q)), 3000); }}} className="text-[#8ab4f8] hover:text-[#aecbfa] transition p-1"><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* Whiteboard Panel */}
            {activePanel === 'whiteboard' && (
              <div className="flex-1 flex flex-col min-h-0 p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <div className="flex gap-1">
                    {['#ffffff','#ff4444','#44ff44','#4488ff','#ffff44'].map(c => (
                      <button key={c} onClick={() => setWhiteboardColor(c)} className={`h-5 w-5 rounded-full border-2 ${whiteboardColor === c ? 'border-[#8ab4f8]' : 'border-transparent'}`} style={{ background: c }} />
                    ))}
                  </div>
                  <button onClick={clearWhiteboard} className="text-[#9aa0a6] hover:text-white p-1 transition"><Eraser className="h-4 w-4" /></button>
                </div>
                <canvas ref={canvasRef} width={280} height={400} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} className="flex-1 bg-[#1a1a2e] rounded-xl cursor-crosshair" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-20 flex items-center justify-between px-4 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2 text-[#9aa0a6] text-xs w-48"><span>{formatTime(meetingTime)}</span><span>|</span><span className="truncate">{interview.company}</span></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleMic} title={isMicOn ? 'Mute' : 'Unmute'} className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isMicOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>{isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
          <button onClick={toggleCamera} title={isCameraOn ? 'Camera off' : 'Camera on'} className={`h-12 w-12 rounded-full flex items-center justify-center transition ${isCameraOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>{isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}</button>
          <button onClick={toggleScreenShare} title="Present" className={`h-12 w-12 rounded-full items-center justify-center transition hidden sm:flex ${isScreenSharing ? 'bg-[#1a73e8] hover:bg-[#1765cc] text-white' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}>{isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}</button>
          <button onClick={() => setIsHandRaised(!isHandRaised)} title="Raise hand" className={`h-12 w-12 rounded-full items-center justify-center transition hidden sm:flex ${isHandRaised ? 'bg-[#fdd663] text-[#202124]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}><Hand className="h-5 w-5" /></button>
          <button onClick={() => setShowReactionPicker(!showReactionPicker)} title="Reactions" className={`h-12 w-12 rounded-full items-center justify-center transition hidden sm:flex ${showReactionPicker ? 'bg-[#394457] text-[#8ab4f8]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}><Smile className="h-5 w-5" /></button>
          <button onClick={() => setShowCaptions(!showCaptions)} title={showCaptions ? 'Turn off captions' : 'Turn on captions'} className={`h-12 w-12 rounded-full items-center justify-center transition hidden sm:flex ${showCaptions ? 'bg-[#394457] text-[#8ab4f8]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}><span className="text-xs font-bold">CC</span></button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setIsMoreOpen(!isMoreOpen); }} className="h-12 w-12 rounded-full flex items-center justify-center bg-[#3c4043] hover:bg-[#4a4d51] text-white transition"><MoreVertical className="h-5 w-5" /></button>
            {isMoreOpen && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-60 bg-[#2d2e31] border border-[#3c4043] rounded-xl shadow-2xl py-1 z-50 max-h-80 overflow-y-auto">
                <button onClick={() => { setLayout(layout === 'speaker' ? 'grid' : 'speaker'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Users className="h-4 w-4" />{layout === 'speaker' ? 'Grid view' : 'Speaker view'}</button>
                <button onClick={() => { setShowCaptions(!showCaptions); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><MessageSquare className={`h-4 w-4 ${showCaptions ? 'text-[#8ab4f8]' : ''}`} />{showCaptions ? 'Turn off live captions' : 'Turn on live captions'}</button>
                <button onClick={() => { toggleFullscreen(); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition">{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
                <button onClick={() => { setIsRecording(!isRecording); showToast(isRecording ? 'Recording stopped' : 'Recording started'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Disc className={`h-4 w-4 ${isRecording ? 'text-red-400' : ''}`} />{isRecording ? 'Stop recording' : 'Record meeting'}</button>
                <button onClick={() => { setNoiseCancellation(!noiseCancellation); showToast(noiseCancellation ? 'Noise cancellation off' : 'Noise cancellation on'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition">{noiseCancellation ? <VolumeX className="h-4 w-4 text-[#8ab4f8]" /> : <Volume2 className="h-4 w-4" />}{noiseCancellation ? 'Noise cancel: ON' : 'Noise cancellation'}</button>
                <button onClick={() => { setBgBlur(!bgBlur); showToast(bgBlur ? 'Background blur off' : 'Background blur on'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Aperture className={`h-4 w-4 ${bgBlur ? 'text-[#8ab4f8]' : ''}`} />{bgBlur ? 'Blur: ON' : 'Blur background'}</button>
                <button onClick={() => { togglePiP(); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><PictureInPicture2 className="h-4 w-4" />Picture-in-picture</button>
                <button onClick={() => { setShowShortcuts(true); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Keyboard className="h-4 w-4" />Keyboard shortcuts</button>
                <div className="border-t border-[#3c4043] my-1" />
                <button onClick={() => { setShowVirtualBg(true); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Image className="h-4 w-4" />Virtual backgrounds</button>
                <button onClick={() => { setLowLightMode(!lowLightMode); showToast(lowLightMode ? 'Low-light off' : 'Low-light mode on'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Sun className={`h-4 w-4 ${lowLightMode ? 'text-[#fdd663]' : ''}`} />{lowLightMode ? 'Low-light: ON' : 'Low-light mode'}</button>
                <button onClick={() => { openPanel('notes'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><StickyNote className="h-4 w-4" />Meeting notes</button>
                <button onClick={() => { openPanel('polls'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><BarChart2 className="h-4 w-4" />Polls</button>
                <button onClick={() => { openPanel('qa'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><HelpCircle className="h-4 w-4" />Q&A</button>
                <button onClick={() => { openPanel('whiteboard'); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><Pencil className="h-4 w-4" />Whiteboard</button>
                <button onClick={() => { setShowAttendance(true); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition"><ClipboardList className="h-4 w-4" />Attendance list</button>
                <div className="border-t border-[#3c4043] my-1" />
                <button onClick={() => { toggleScreenShare(); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition sm:hidden"><MonitorUp className="h-4 w-4" />{isScreenSharing ? 'Stop presenting' : 'Present screen'}</button>
                <button onClick={() => { setIsHandRaised(!isHandRaised); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition sm:hidden"><Hand className="h-4 w-4" />{isHandRaised ? 'Lower hand' : 'Raise hand'}</button>
                <button onClick={() => { setShowReactionPicker(true); setIsMoreOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition sm:hidden"><Smile className="h-4 w-4" />Reactions</button>
              </div>
            )}
          </div>
          <button onClick={endCall} className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition gap-2"><Phone className="h-5 w-5 rotate-[135deg]" /><span className="hidden sm:inline text-sm font-medium">Leave</span></button>
        </div>
        <div className="flex items-center gap-1 w-48 justify-end">
          <button onClick={() => openPanel('chat')} title="Chat" className={`h-10 w-10 rounded-full flex items-center justify-center transition ${activePanel === 'chat' ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#e8eaed] hover:bg-[#3c4043]'}`}><MessageSquare className="h-5 w-5" /></button>
          <button onClick={() => openPanel('people')} title="People" className={`h-10 w-10 rounded-full flex items-center justify-center transition ${activePanel === 'people' ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#e8eaed] hover:bg-[#3c4043]'}`}><Users className="h-5 w-5" /></button>
          <button onClick={() => openPanel('whiteboard')} title="Whiteboard" className={`h-10 w-10 rounded-full hidden md:flex items-center justify-center transition ${activePanel === 'whiteboard' ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#e8eaed] hover:bg-[#3c4043]'}`}><Pencil className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#2d2e31] border border-[#3c4043] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Keyboard shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-[#9aa0a6] hover:text-white transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { keys: 'Ctrl + D', action: 'Toggle microphone' },
                { keys: 'Ctrl + E', action: 'Toggle camera' },
                { keys: 'Ctrl + H', action: 'Raise / lower hand' },
              ].map(s => (
                <div key={s.keys} className="flex items-center justify-between">
                  <span className="text-[#e8eaed] text-sm">{s.action}</span>
                  <kbd className="bg-[#3c4043] text-[#8ab4f8] text-xs font-mono px-2.5 py-1 rounded-lg">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Virtual Background Modal */}
      {showVirtualBg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowVirtualBg(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#2d2e31] border border-[#3c4043] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Visual effects</h3>
              <button onClick={() => setShowVirtualBg(false)} className="text-[#9aa0a6] hover:text-white transition"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-[#9aa0a6] text-xs mb-4">Backgrounds</p>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { id: 'none', label: 'None', color: 'bg-[#3c4043]' },
                { id: 'blur', label: 'Blur', color: 'bg-gradient-to-br from-blue-400/30 to-purple-400/30' },
                { id: 'office', label: 'Office', color: 'bg-gradient-to-br from-amber-700 to-amber-900' },
                { id: 'beach', label: 'Beach', color: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
                { id: 'mountain', label: 'Mountain', color: 'bg-gradient-to-br from-slate-600 to-emerald-800' },
                { id: 'space', label: 'Space', color: 'bg-gradient-to-br from-indigo-900 to-black' },
                { id: 'library', label: 'Library', color: 'bg-gradient-to-br from-amber-800 to-stone-700' },
                { id: 'cafe', label: 'Cafe', color: 'bg-gradient-to-br from-orange-800 to-amber-600' },
              ].map(bg => (
                <button key={bg.id} onClick={() => { setSelectedBg(bg.id); setBgBlur(bg.id === 'blur'); showToast(bg.id === 'none' ? 'Background removed' : `Background: ${bg.label}`); }} className={`aspect-video rounded-lg ${bg.color} flex items-center justify-center text-white text-xs font-medium border-2 transition ${selectedBg === bg.id ? 'border-[#8ab4f8]' : 'border-transparent hover:border-[#5f6368]'}`}>
                  {bg.label}
                </button>
              ))}
            </div>
            <p className="text-[#9aa0a6] text-xs mb-3">Filters</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'grayscale', label: 'B&W' },
                { id: 'sepia', label: 'Sepia' },
                { id: 'warm', label: 'Warm' },
                { id: 'cool', label: 'Cool' },
              ].map(f => (
                <button key={f.id} onClick={() => { setVideoFilter(f.id); showToast(f.id === 'none' ? 'Filter removed' : `Filter: ${f.label}`); }} className={`py-2 rounded-lg text-xs font-medium transition ${videoFilter === f.id ? 'bg-[#1a73e8] text-white' : 'bg-[#3c4043] text-[#e8eaed] hover:bg-[#4a4d51]'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendance && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setShowAttendance(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#2d2e31] border border-[#3c4043] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Meeting attendance</h3>
              <button onClick={() => setShowAttendance(false)} className="text-[#9aa0a6] hover:text-white transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { name: interviewerName, role: 'Host (Interviewer)', joined: interview.time, status: 'In call' },
                { name: userName, role: 'Candidate', joined: 'Just now', status: 'In call' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#3c4043] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-medium ${i === 0 ? 'bg-teal-600' : 'bg-indigo-600'}`}>{a.name[0].toUpperCase()}</div>
                    <div>
                      <p className="text-white text-sm">{a.name}</p>
                      <p className="text-[#5f6368] text-xs">{a.role} · Joined {a.joined}</p>
                    </div>
                  </div>
                  <span className="text-[#81c995] text-xs">{a.status}</span>
                </div>
              ))}
            </div>
            <p className="text-[#5f6368] text-xs mt-4 text-center">Meeting started at {interview.time} · {formatTime(meetingTime)} elapsed</p>
          </div>
        </div>
      )}

      {/* End Call Summary Screen */}
      {showEndScreen && (
        <div className="fixed inset-0 z-[70] bg-[#202124] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="h-20 w-20 mx-auto rounded-full bg-[#3c4043] flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-white rotate-[135deg]" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">You left the meeting</h2>
            <p className="text-[#9aa0a6] text-sm mb-2">{interview.jobTitle} - {interview.round}</p>
            <p className="text-[#9aa0a6] text-sm mb-4">Duration: {formatTime(meetingTime)} | Messages: {chatMessages.length}</p>
            <div className="bg-[#2d2e31] border border-[#3c4043] rounded-xl p-4 mb-6 text-left">
              <p className="text-[#8ab4f8] text-xs font-medium mb-2 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />Auto-generated summary</p>
              <p className="text-[#e8eaed] text-sm leading-relaxed">
                Interview with {interviewerName} at {interview.company} for {interview.jobTitle} ({interview.round}).
                Duration: {formatTime(meetingTime)}.
                {chatMessages.length > 0 ? ` ${chatMessages.length} messages exchanged.` : ''}
                {notes ? ' Meeting notes were taken.' : ''}
                {qaQuestions.length > 0 ? ` ${qaQuestions.length} Q&A questions asked.` : ''}
                {isRecording ? ' Meeting was recorded.' : ''}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={onLeave} className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white font-medium rounded-full transition">Return to interviews</button>
              <button onClick={() => { setShowEndScreen(false); setIsLobby(true); setMeetingTime(0); startCamera(); }} className="px-6 py-2.5 bg-[#3c4043] hover:bg-[#4a4d51] text-white font-medium rounded-full transition">Rejoin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== Interview Page — Join Meeting ========== */

export function Interview() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';

  const [interviews, setInterviews] = useState<InterviewData[]>(sampleInterviews);
  const [activeMeeting, setActiveMeeting] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    const fetchInterviews = async () => {
      try {
        const res = await axios.get(getApiUrl(`/interviews?candidateEmail=${encodeURIComponent(user.email)}`));
        if (res.data && res.data.length > 0) {
          setInterviews(res.data.map((i: any) => ({
            id: i._id, jobTitle: i.jobTitle, company: i.company, date: i.date, time: i.time,
            duration: i.duration || '45 min', type: i.type || 'video', status: i.status || 'upcoming',
            round: i.round || 'Interview Round', interviewer: i.interviewer, location: i.location,
            meetingLink: i.type === 'video' ? '#' : undefined, notes: i.notes,
          })));
        }
      } catch { /* keep sample data */ }
      setLoading(false);
    };
    fetchInterviews();
  }, [user?.email]);

  // If inside a meeting, show the MeetingRoom
  if (activeMeeting) {
    return <MeetingRoom interview={activeMeeting} onLeave={() => setActiveMeeting(null)} />;
  }

  const upcoming = interviews
    .filter(i => i.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const isToday = (d: string) => d === new Date().toISOString().split('T')[0];
  const isTomorrow = (d: string) => { const t = new Date(); t.setDate(t.getDate() + 1); return d === t.toISOString().split('T')[0]; };
  const getDateLabel = (d: string) => { if (isToday(d)) return 'Today'; if (isTomorrow(d)) return 'Tomorrow'; try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } };
  const getCompanyColor = (name: string) => {
    const colors = ['from-blue-500 to-indigo-600','from-indigo-500 to-purple-600','from-purple-500 to-violet-600','from-emerald-500 to-teal-600','from-orange-500 to-red-600','from-rose-500 to-pink-600','from-cyan-500 to-blue-600','from-teal-500 to-emerald-600'];
    return colors[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length];
  };
  const TypeIcon = (t: string) => t === 'phone' ? Phone : t === 'in-person' ? User : Video;

  const card = `rounded-2xl border transition-all ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm'}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Join Meeting</h1>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {upcoming.length > 0
            ? `You have ${upcoming.length} upcoming interview${upcoming.length > 1 ? 's' : ''}. Click "Join" when ready.`
            : 'No upcoming interviews right now.'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {/* Interview cards */}
      {!loading && upcoming.length > 0 && (
        <div className="space-y-4">
          {upcoming.map((interview) => {
            const TIcon = TypeIcon(interview.type);
            const dateLabel = getDateLabel(interview.date);
            const isNow = isToday(interview.date);

            return (
              <div key={interview.id} className={`${card} overflow-hidden`}>
                <div className="flex items-stretch">
                  {/* Color stripe */}
                  <div className={`w-1.5 bg-gradient-to-b ${getCompanyColor(interview.company)}`} />

                  <div className="flex flex-1 items-center gap-5 p-5 sm:p-6">
                    {/* Company initial */}
                    <div className={`hidden sm:flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getCompanyColor(interview.company)} shadow-lg`}>
                      <span className="text-2xl font-bold text-white">{interview.company.charAt(0)}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNow && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-500 ring-1 ring-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Today
                          </span>
                        )}
                        {!isNow && (
                          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{dateLabel}</span>
                        )}
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{interview.time}</span>
                      </div>

                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{interview.jobTitle}</h3>
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{interview.company}</p>

                      <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{interview.round}</span>
                        <span className="flex items-center gap-1"><TIcon className="h-3.5 w-3.5" /><span className="capitalize">{interview.type === 'in-person' ? 'In Person' : interview.type}</span></span>
                        <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{interview.duration}</span>
                        {interview.interviewer && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{interview.interviewer}</span>}
                      </div>

                      {interview.notes && (
                        <p className={`mt-2 text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{interview.notes}</p>
                      )}
                    </div>

                    {/* Join button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setActiveMeeting(interview)}
                        className="group flex items-center gap-2 rounded-2xl bg-[#1a73e8] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#1765cc] hover:translate-y-[-2px] hover:shadow-xl hover:shadow-blue-500/30"
                      >
                        <Video className="h-5 w-5" />
                        <span>Join</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && upcoming.length === 0 && (
        <div className={`${card} flex flex-col items-center justify-center py-20 text-center`}>
          <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
            <Video className={`h-10 w-10 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
          </div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No upcoming meetings</h3>
          <p className={`mt-2 max-w-sm text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            When a recruiter schedules an interview with you, it will appear here with a "Join" button.
          </p>
        </div>
      )}
    </div>
  );
}
