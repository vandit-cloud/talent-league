import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Phone,
  MessageSquare, Users, Hand, MoreVertical, X,
  Send, Copy, Check, Shield,
  Maximize, Minimize, Pin, PinOff,
  ScreenShare, ScreenShareOff, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  isHandRaised: boolean;
}

export function VideoMeeting() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const jobTitle = searchParams.get('job') || 'Interview';
  const company = searchParams.get('company') || 'Company';
  const round = searchParams.get('round') || 'Interview Round';
  const interviewer = searchParams.get('interviewer') || 'Interviewer';

  // Meeting state
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [mediaError, setMediaError] = useState('');

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated participants
  const [participants] = useState<Participant[]>([
    { id: '1', name: interviewer, isMuted: false, isVideoOff: false, isHost: true, isSpeaking: false, isHandRaised: false },
    { id: '2', name: user?.name || 'You', isMuted: !isMicOn, isVideoOff: !isCameraOn, isHost: false, isSpeaking: false, isHandRaised: isHandRaised },
  ]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaError('');
    } catch (err) {
      console.error('Camera error:', err);
      setMediaError('Could not access camera or microphone. Please check permissions.');
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Toggle mic
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  };

  // End call
  const endCall = () => {
    stopCamera();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    navigate('/interview');
  };

  // Join meeting
  const joinMeeting = async () => {
    await startCamera();
    setIsJoined(true);
    timerRef.current = setInterval(() => setMeetingTime(t => t + 1), 1000);
  };

  // Send chat
  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || 'You',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');

    // Simulate reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: interviewer,
        text: getAutoReply(chatInput.trim()),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      }]);
    }, 2000 + Math.random() * 3000);
  };

  const getAutoReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi')) return 'Hello! Great to have you here. Shall we begin?';
    if (lower.includes('ready')) return 'Perfect, let\'s get started with the interview.';
    if (lower.includes('thank')) return 'You\'re welcome! Good luck!';
    if (lower.includes('question')) return 'Sure, feel free to ask any questions.';
    return 'Thanks for the message. Let\'s continue with the interview.';
  };

  // Copy meeting link
  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopCamera]);

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setIsMoreOpen(false);
    if (isMoreOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [isMoreOpen]);

  // Pre-join lobby
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          {/* Video Preview */}
          <div className="relative">
            <div className="relative aspect-video bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-semibold">{(user?.name || 'U')[0].toUpperCase()}</span>
                  </div>
                </div>
              )}
              {mediaError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
                  <p className="text-red-400 text-sm text-center">{mediaError}</p>
                </div>
              )}

              {/* Preview Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!localStreamRef.current) { startCamera(); setIsMicOn(true); setIsCameraOn(true); return; }
                    toggleMic();
                  }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    isMicOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => {
                    if (!localStreamRef.current) { startCamera(); setIsMicOn(true); setIsCameraOn(true); return; }
                    toggleCamera();
                  }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    isCameraOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Join Panel */}
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold text-white mb-2">Ready to join?</h1>
            <p className="text-[#9aa0a6] text-sm mb-1">{jobTitle} - {round}</p>
            <p className="text-[#9aa0a6] text-sm mb-6">{company}</p>

            <button
              onClick={joinMeeting}
              className="w-full lg:w-auto px-8 py-3 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-base font-medium rounded-full transition-all"
            >
              Join now
            </button>

            <div className="mt-6 flex items-center justify-center lg:justify-start gap-3">
              <button
                onClick={copyMeetingLink}
                className="flex items-center gap-2 text-[#8ab4f8] hover:text-[#aecbfa] text-sm transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy meeting link'}
              </button>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-[#2d2e31] border border-[#3c4043]">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-4 w-4 text-[#8ab4f8]" />
                <span className="text-white text-sm font-medium">Interview is secure</span>
              </div>
              <p className="text-[#9aa0a6] text-xs">This meeting is private and encrypted. Only invited participants can join.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Meeting UI
  const sidebarOpen = isChatOpen || isPeopleOpen;

  return (
    <div className="h-screen bg-[#202124] flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-medium text-sm hidden sm:block">{jobTitle}</span>
          </div>
          <span className="text-[#9aa0a6] text-xs hidden md:block">|</span>
          <span className="text-[#9aa0a6] text-xs hidden md:block">{round}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#9aa0a6] text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatTime(meetingTime)}</span>
          </div>
          <button
            onClick={copyMeetingLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#8ab4f8] hover:bg-[#3c4043] transition"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Area */}
        <div className="flex-1 relative p-2 flex items-center justify-center">
          {isScreenSharing ? (
            /* Screen Share Layout */
            <div className="w-full h-full flex flex-col gap-2">
              <div className="flex-1 relative bg-black rounded-xl overflow-hidden">
                <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <ScreenShare className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-white text-xs">You are presenting</span>
                </div>
              </div>
              {/* Self view mini */}
              <div className="absolute bottom-4 right-4 w-48 aspect-video bg-[#3c4043] rounded-xl overflow-hidden shadow-2xl border-2 border-[#3c4043] hover:border-[#8ab4f8] transition cursor-pointer z-10">
                <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">{(user?.name || 'U')[0].toUpperCase()}</span>
                    </div>
                  </div>
                )}
                {!isMicOn && (
                  <div className="absolute bottom-2 left-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ) : layout === 'speaker' ? (
            /* Speaker Layout */
            <div className="w-full h-full flex flex-col gap-2">
              {/* Main speaker (interviewer placeholder) */}
              <div className="flex-1 relative bg-[#3c4043] rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-28 w-28 rounded-full bg-teal-600 flex items-center justify-center">
                    <span className="text-white text-5xl font-semibold">{interviewer[0].toUpperCase()}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-white text-sm">{interviewer}</span>
                  {participants[0]?.isHost && <Shield className="h-3 w-3 text-[#8ab4f8]" />}
                </div>
              </div>
              {/* Self view */}
              <div
                className={`absolute bottom-4 right-4 ${isPinned ? 'w-72' : 'w-48'} aspect-video bg-[#3c4043] rounded-xl overflow-hidden shadow-2xl border-2 border-[#3c4043] hover:border-[#8ab4f8] transition cursor-pointer z-10`}
                onClick={() => setIsPinned(!isPinned)}
              >
                <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">{(user?.name || 'U')[0].toUpperCase()}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-white text-xs">You</span>
                </div>
                {!isMicOn && (
                  <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition">
                  {isPinned ? <PinOff className="h-4 w-4 text-white drop-shadow" /> : <Pin className="h-4 w-4 text-white drop-shadow" />}
                </div>
              </div>
            </div>
          ) : (
            /* Grid Layout */
            <div className="w-full h-full grid grid-cols-2 gap-2">
              {/* Interviewer */}
              <div className="relative bg-[#3c4043] rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-teal-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-semibold">{interviewer[0].toUpperCase()}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-white text-sm">{interviewer}</span>
                </div>
              </div>
              {/* Self */}
              <div className="relative bg-[#3c4043] rounded-xl overflow-hidden">
                <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} />
                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-semibold">{(user?.name || 'U')[0].toUpperCase()}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-white text-sm">You</span>
                </div>
                {!isMicOn && (
                  <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-red-500 flex items-center justify-center">
                    <MicOff className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hand Raised Indicator */}
          {isHandRaised && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#fdd663] text-[#202124] px-4 py-2 rounded-full text-sm font-medium shadow-lg z-20">
              <Hand className="h-4 w-4" />
              You raised your hand
            </div>
          )}

          {/* Captions */}
          {showCaptions && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 z-20">
              <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-white text-sm">Captions will appear here during the conversation...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Chat / People) */}
        {sidebarOpen && (
          <div className="w-80 flex-shrink-0 bg-[#2d2e31] border-l border-[#3c4043] flex flex-col">
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#3c4043] flex-shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => { setIsChatOpen(true); setIsPeopleOpen(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    isChatOpen ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#9aa0a6] hover:bg-[#3c4043]'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => { setIsPeopleOpen(true); setIsChatOpen(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    isPeopleOpen ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#9aa0a6] hover:bg-[#3c4043]'
                  }`}
                >
                  People ({participants.length})
                </button>
              </div>
              <button
                onClick={() => { setIsChatOpen(false); setIsPeopleOpen(false); }}
                className="p-1.5 rounded-full text-[#9aa0a6] hover:bg-[#3c4043] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat */}
            {isChatOpen && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-[#5f6368] mx-auto mb-3" />
                      <p className="text-[#9aa0a6] text-sm">No messages yet</p>
                      <p className="text-[#5f6368] text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  )}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs font-medium ${msg.isMe ? 'text-[#8ab4f8]' : 'text-[#e8eaed]'}`}>{msg.sender}</span>
                        <span className="text-[#5f6368] text-xs">{msg.time}</span>
                      </div>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                        msg.isMe
                          ? 'bg-[#1a73e8] text-white rounded-tr-sm'
                          : 'bg-[#3c4043] text-[#e8eaed] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-[#3c4043] flex-shrink-0">
                  <div className="flex items-center gap-2 bg-[#3c4043] rounded-full px-4 py-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-[#9aa0a6] focus:outline-none"
                      placeholder="Send a message..."
                    />
                    <button onClick={sendChat} className="text-[#8ab4f8] hover:text-[#aecbfa] transition p-1">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* People */}
            {isPeopleOpen && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#3c4043] transition">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-medium ${
                        p.isHost ? 'bg-teal-600' : 'bg-indigo-600'
                      }`}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm">{p.name}</span>
                          {p.isHost && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#394457] text-[#8ab4f8] font-medium">Host</span>
                          )}
                          {p.id === '2' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#394457] text-[#81c995] font-medium">You</span>
                          )}
                        </div>
                        {p.isHandRaised && <span className="text-xs text-[#fdd663]">Hand raised</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {p.isMuted && <MicOff className="h-4 w-4 text-red-400" />}
                      {p.isVideoOff && <VideoOff className="h-4 w-4 text-[#9aa0a6]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-20 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left - Meeting Info */}
        <div className="hidden md:flex items-center gap-2 text-[#9aa0a6] text-xs w-48">
          <span>{formatTime(meetingTime)}</span>
          <span>|</span>
          <span className="truncate">{company}</span>
        </div>

        {/* Center - Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleMic}
            title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
              isMicOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
              isCameraOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop presenting' : 'Present now'}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all hidden sm:flex ${
              isScreenSharing ? 'bg-[#1a73e8] hover:bg-[#1765cc] text-white' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'
            }`}
          >
            {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all hidden sm:flex ${
              isHandRaised ? 'bg-[#fdd663] text-[#202124]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'
            }`}
          >
            <Hand className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMoreOpen(!isMoreOpen); }}
              title="More options"
              className="h-12 w-12 rounded-full flex items-center justify-center bg-[#3c4043] hover:bg-[#4a4d51] text-white transition-all"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {isMoreOpen && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-56 bg-[#2d2e31] border border-[#3c4043] rounded-xl shadow-2xl py-1 z-50">
                <button onClick={() => { setLayout(layout === 'speaker' ? 'grid' : 'speaker'); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition">
                  <Users className="h-4 w-4" />
                  {layout === 'speaker' ? 'Grid view' : 'Speaker view'}
                </button>
                <button onClick={() => { setShowCaptions(!showCaptions); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition">
                  <MessageSquare className="h-4 w-4" />
                  {showCaptions ? 'Hide captions' : 'Turn on captions'}
                </button>
                <button onClick={() => { toggleFullscreen(); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition">
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </button>
                <button onClick={() => { setIsHandRaised(!isHandRaised); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition sm:hidden">
                  <Hand className="h-4 w-4" />
                  {isHandRaised ? 'Lower hand' : 'Raise hand'}
                </button>
                <button onClick={() => { toggleScreenShare(); setIsMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-[#3c4043] transition sm:hidden">
                  <MonitorUp className="h-4 w-4" />
                  {isScreenSharing ? 'Stop presenting' : 'Present screen'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={endCall}
            title="Leave call"
            className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all gap-2"
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
            <span className="hidden sm:inline text-sm font-medium">Leave</span>
          </button>
        </div>

        {/* Right - Side panels */}
        <div className="flex items-center gap-1 w-48 justify-end">
          <button
            onClick={() => { setIsChatOpen(!isChatOpen); setIsPeopleOpen(false); }}
            title="Chat"
            className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
              isChatOpen ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#e8eaed] hover:bg-[#3c4043]'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setIsPeopleOpen(!isPeopleOpen); setIsChatOpen(false); }}
            title="People"
            className={`h-10 w-10 rounded-full flex items-center justify-center transition ${
              isPeopleOpen ? 'bg-[#394457] text-[#8ab4f8]' : 'text-[#e8eaed] hover:bg-[#3c4043]'
            }`}
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoMeeting;
