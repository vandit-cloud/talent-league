import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain } from 'lucide-react';

export function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const { setAuthSession } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const userId = searchParams.get('id');
        const avatar = searchParams.get('avatar');
        const phone = searchParams.get('phone');
        const location = searchParams.get('location');
        const returnUrl = searchParams.get('returnUrl');

        if (token) {
            const userData = {
                name,
                email: email || '',
                role: (role as 'candidate' | 'recruiter' | 'admin') || 'candidate',
                avatar: avatar || undefined,
                id: userId || 'social',
                onboardingComplete: true,
                contactInfo: {
                    phone: phone || undefined,
                    location: location || undefined
                }
            };

            setAuthSession(userData as any, token);

            setTimeout(() => {
                if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
                    navigate(returnUrl);
                } else if (role === 'recruiter') {
                    navigate('/recruiter/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);
        } else {
            console.error('OAuth Callback: No token found');
            navigate('/login?error=no_token');
        }
    }, [searchParams, navigate, setAuthSession]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Brain className="h-12 w-12 text-white" />
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
            <p className="text-gray-400">Completing secure sign-in, please wait.</p>

            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
}
