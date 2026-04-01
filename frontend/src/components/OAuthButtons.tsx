import { Chrome, Linkedin } from 'lucide-react';

interface OAuthButtonsProps {
  onGoogleClick: () => void;
  onLinkedInClick: () => void;
  googleLoading?: boolean;
  linkedinLoading?: boolean;
}

export function OAuthButtons({ 
  onGoogleClick, 
  onLinkedInClick, 
  googleLoading = false, 
  linkedinLoading = false 
}: OAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Chrome className="h-5 w-5" />
        )}
        <span className="font-medium">
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </span>
      </button>

      <button
        type="button"
        onClick={onLinkedInClick}
        disabled={linkedinLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {linkedinLoading ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Linkedin className="h-5 w-5" />
        )}
        <span className="font-medium">
          {linkedinLoading ? 'Connecting...' : 'Continue with LinkedIn'}
        </span>
      </button>
    </div>
  );
}
