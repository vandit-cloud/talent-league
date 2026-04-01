import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import ProfilePage from './pages/ProfilePage';
import TestPage from './pages/TestPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

interface DeepLinkConfig {
  backendUrl: string | null;
  frontendUrl: string | null;
}

const parseDeepLinkConfig = (url: string): DeepLinkConfig => {
  try {
    const parsedUrl = new URL(url);
    return {
      backendUrl: parsedUrl.searchParams.get('backend'),
      frontendUrl: parsedUrl.searchParams.get('frontend'),
    };
  } catch (error) {
    console.warn('Unable to parse deep link URL, falling back to query parsing:', error);
    const query = url.split('?')[1];
    const params = new URLSearchParams(query || '');

    return {
      backendUrl: params.get('backend'),
      frontendUrl: params.get('frontend'),
    };
  }
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('home');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [mcqToken, setMcqToken] = useState<string | null>(null);
  const [mcqBackendUrl, setMcqBackendUrl] = useState<string | null>(null);
  const [mcqFrontendUrl, setMcqFrontendUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);

      const tokenMatch = url.match(/(?:talentleague:\/\/test\/|\/mcq-test\/|\/test\/|\/open-app\/)([^/?#]+)/i);
      const token = tokenMatch?.[1] ?? null;
      const { backendUrl, frontendUrl } = parseDeepLinkConfig(url);

      setMcqBackendUrl(backendUrl);
      setMcqFrontendUrl(frontendUrl);

      if (backendUrl) {
        console.log('Using backend from deep link:', backendUrl);
      }

      if (frontendUrl) {
        console.log('Using frontend from deep link:', frontendUrl);
      }

      if (token && token.length > 10) {
        console.log('Opening MCQ test for token:', token);
        setMcqToken(token);
        setActiveTab('test');
        return;
      }

      console.warn('Deep link did not contain a valid MCQ token');
    };

    const checkInitialUrl = async () => {
      try {
        const result = await CapacitorApp.getLaunchUrl();
        if (result?.url) {
          handleDeepLink(result.url);
        }
      } catch (error) {
        console.error('Error getting launch URL:', error);
      }
    };

    const listener = CapacitorApp.addListener('appUrlOpen', (data: { url?: string }) => {
      if (data?.url) {
        handleDeepLink(data.url);
      }
    });

    checkInitialUrl();

    return () => {
      listener.then((subscription) => subscription.remove());
    };
  }, []);

  // Show auth screens when not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SignupPage onNavigateToLogin={() => setAuthScreen('login')} />
      );
    }
    return (
      <LoginPage onNavigateToSignup={() => setAuthScreen('signup')} />
    );
  }

  // Authenticated - show main app
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'jobs':
        return <JobsPage />;
      case 'test':
        return <TestPage mcqToken={mcqToken} backendUrl={mcqBackendUrl} frontendUrl={mcqFrontendUrl} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app">
      <div className="app-content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
