const axios = require('axios');
const User = require('../models/User');
const Identity = require('../models/Identity');
const { buildUserPayload, generateToken } = require('./authController');

// Configuration for providers
const providers = {
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userinfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
        scopes: ['openid', 'email', 'profile']
    },
    github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userinfoUrl: 'https://api.github.com/user',
        scopes: ['read:user', 'user:email']
    },
    linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        userinfoUrl: 'https://api.linkedin.com/v2/userinfo',
        scopes: ['openid', 'profile', 'email']
    },
    microsoft: {
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userinfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
        scopes: ['openid', 'profile', 'email', 'offline_access']
    }
};

const getConfiguredBackendUrl = () => process.env.BACKEND_URL || 'http://localhost:5000';
const getConfiguredFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

const isPlaceholderValue = (value = '') => {
    const normalized = String(value).trim().toLowerCase();
    return !normalized || normalized.includes('your_') || normalized.includes('your-') || normalized.includes('placeholder');
};

const getProviderCredentials = (provider) => {
    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const configuredRedirectUri = process.env[`${provider.toUpperCase()}_REDIRECT_URI`];
    const backendUrl = getConfiguredBackendUrl();
    const defaultRedirectUri = `${backendUrl}/api/auth/oauth/${provider}/callback`;
    const redirectUri = isPlaceholderValue(configuredRedirectUri) || String(configuredRedirectUri || '').includes('localhost')
        ? defaultRedirectUri
        : configuredRedirectUri;

    return { clientId, clientSecret, redirectUri };
};

// @desc    Start OAuth flow
// @route   GET /api/auth/oauth/:provider/start
const startOAuth = async (req, res) => {
    const { provider } = req.params;
    const { role = 'candidate', returnUrl = '/' } = req.query;

    const config = providers[provider];
    if (!config) {
        return res.status(400).json({ message: 'Invalid provider' });
    }

    const { clientId, clientSecret, redirectUri } = getProviderCredentials(provider);
    const requiresSecret = provider !== 'google';

    // Generate a secure state
    const state = Buffer.from(JSON.stringify({ role, returnUrl, provider })).toString('base64');

    // FALLBACK: If keys are missing, use the Simulation Site
    if (isPlaceholderValue(clientId) || isPlaceholderValue(redirectUri) || (requiresSecret && isPlaceholderValue(clientSecret))) {
        console.log(`🚀 [OAuth Sandbox] Bypassing real ${provider} flow because keys are missing. Redirecting to Sandbox UI.`);
        const backendUrl = getConfiguredBackendUrl();
        return res.redirect(`${backendUrl}/api/auth/oauth/sandbox/login?state=${state}`);
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: state
    });

    res.redirect(`${config.authUrl}?${params.toString()}`);
};

/**
 * @desc    Serve a Mock Login Page for Sandbox Mode
 * @route   GET /api/auth/oauth/sandbox/login
 */
const renderSandboxLogin = (req, res) => {
    const { state } = req.query;
    const { provider } = JSON.parse(Buffer.from(state, 'base64').toString());

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sandbox: Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}</title>
            <style>
                body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #1e293b; padding: 2rem; border-radius: 1rem; width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; border: 1px solid #334155; }
                .logo { font-size: 3rem; margin-bottom: 1rem; }
                p { color: #94a3b8; }
                input { width: 100%; padding: 0.75rem; margin: 1rem 0; border-radius: 0.5rem; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
                button { width: 100%; padding: 0.75rem; border: none; border-radius: 0.5rem; background: #6366f1; color: white; font-weight: bold; cursor: pointer; transition: background 0.2s; }
                button:hover { background: #4f46e5; }
                .badge { display: inline-block; padding: 0.25rem 0.5rem; background: #f59e0b22; color: #f59e0b; font-size: 0.75rem; border-radius: 9999px; margin-bottom: 1rem; border: 1px solid #f59e0b44; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="badge">DEVELOPER SANDBOX MODE</div>
                <div class="logo">${provider === 'google' ? '🌐' : provider === 'github' ? '🐙' : '📄'}</div>
                <h1>Sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}</h1>
                <p>This is a simulated ${provider} login page because your API keys are not set.</p>
                <form action="/api/auth/oauth/sandbox/complete" method="POST">
                    <input type="hidden" name="state" value="${state}">
                    <input type="email" name="email" placeholder="Enter your email" required value="user@example.com">
                    <input type="text" name="name" placeholder="Full Name" required value="Sandbox User">
                    <button type="submit">Sign in as Candidate</button>
                    <button type="submit" name="forceRole" value="recruiter" style="margin-top: 10px; background: #9333ea;">Sign in as Recruiter</button>
                </form>
            </div>
        </body>
        </html>
    `);
};

/**
 * @desc    Handle Sandbox Completion
 * @route   POST /api/auth/oauth/sandbox/complete
 */
const handleSandboxComplete = async (req, res) => {
    const { state, email, name, forceRole } = req.body;
    const { provider, role, returnUrl } = JSON.parse(Buffer.from(state, 'base64').toString());

    console.log(`✅ [OAuth Sandbox] Simulating callback for ${email} (${name}) as ${forceRole || role}`);

    // Create a mock code that represents this user
    const mockCode = Buffer.from(JSON.stringify({ email, name, forceRole: forceRole || role })).toString('base64');

    // Redirect to the "real" callback endpoint with this mock code
    res.redirect(`/api/auth/oauth/${provider}/callback?code=MOCK_${mockCode}&state=${state}`);
};


// @desc    OAuth Callback
// @route   GET /api/auth/oauth/:provider/callback
const handleOAuthCallback = async (req, res) => {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).json({ message: 'Authorization code missing' });
    }

    try {
        const { role, returnUrl } = JSON.parse(Buffer.from(state, 'base64').toString());
        const config = providers[provider];

        let access_token, refresh_token, expires_in, profile;

        // INTERCEPT: If it's a mock code from our Sandbox
        if (code.startsWith('MOCK_')) {
            const mockData = JSON.parse(Buffer.from(code.replace('MOCK_', ''), 'base64').toString());
            console.log(`💡 [OAuth Sandbox] Processing mock data for ${mockData.email}`);

            access_token = 'sandbox_access_token';
            refresh_token = 'sandbox_refresh_token';
            expires_in = 3600;

            profile = {
                sub: `sandbox_${mockData.email}`,
                id: `sandbox_${mockData.email}`,
                email: mockData.email,
                name: mockData.name,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(mockData.name)}&background=random`,
                role: mockData.forceRole || role
            };
        } else {
            // REAL FLOW
            const { clientId, clientSecret, redirectUri } = getProviderCredentials(provider);

            // 1. Exchange code for token
            const tokenRes = await axios.post(config.tokenUrl, new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }), {
                headers: { Accept: 'application/json' }
            });

            access_token = tokenRes.data.access_token;
            refresh_token = tokenRes.data.refresh_token;
            expires_in = tokenRes.data.expires_in;

            // 2. Fetch user profile
            const userinfoRes = await axios.get(config.userinfoUrl, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            profile = userinfoRes.data;
        }

        // Normalize profile data based on provider

        // Normalize profile data based on provider
        let providerUserId, email, name, avatar;

        if (provider === 'google') {
            providerUserId = profile.sub;
            email = profile.email;
            name = profile.name;
            avatar = profile.picture;
        } else if (provider === 'github') {
            providerUserId = String(profile.id);
            name = profile.name || profile.login;
            avatar = profile.avatar_url;
            // GitHub email might require extra request if not public
            email = profile.email;
            if (!email) {
                const emailRes = await axios.get('https://api.github.com/api/v3/user/emails', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                const primaryEmail = emailRes.data.find(e => e.primary);
                email = primaryEmail ? primaryEmail.email : null;
            }
        } else {
            // Default mappings for OIDC compatible (Microsoft, LinkedIn OpenID)
            providerUserId = profile.sub || profile.id;
            email = profile.email;
            name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim();
            avatar = profile.picture || profile.avatar_url;
        }

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by social login' });
        }

        // 3. Find or Create User
        let user = await User.findOne({ email });

        if (!user) {
            // SECURITY: Always create OAuth users as candidates.
            // Recruiters must go through /register-recruiter with GST/CIN verification.
            user = await User.create({
                name,
                email,
                role: 'candidate',
                avatar,
                isSocialOnly: true,
                emailVerified: true,
                verificationStatus: 'not_required'
            });
        } else {
            let userChanged = false;

            if (!user.name && name) {
                user.name = name;
                userChanged = true;
            }

            if (!user.avatar && avatar) {
                user.avatar = avatar;
                userChanged = true;
            }

            if (role && user.role !== role) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(`This account is registered as a ${user.role}. Please select "${user.role}" to sign in.`)}`);
            }

            if (userChanged) {
                await user.save();
            }
        }

        // 4. Update or Create Identity
        await Identity.findOneAndUpdate(
            { provider, providerUserId },
            {
                userId: user._id,
                emailFromProvider: email,
                emailVerifiedByProvider: true,
                tokens: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null
                },
                profileSnapshot: { name, avatar, raw: profile },
                lastSyncAt: new Date()
            },
            { upsert: true, new: true }
        );

        // 5. Generate Application Token and Redirect to Frontend
        const appToken = generateToken(user._id);
        const authUser = buildUserPayload(user);

        // Redirect to frontend with token (In prod, use secure cookies instead of URL params)
        const frontendUrl = getConfiguredFrontendUrl();
        const redirectPath = `${frontendUrl}/oauth/callback?token=${encodeURIComponent(appToken)}&role=${encodeURIComponent(authUser.role || 'candidate')}&name=${encodeURIComponent(authUser.name || '')}&email=${encodeURIComponent(authUser.email || '')}&id=${encodeURIComponent(String(authUser._id || user._id))}&avatar=${encodeURIComponent(authUser.avatar || '')}&phone=${encodeURIComponent(authUser.contactInfo?.phone || '')}&location=${encodeURIComponent(authUser.contactInfo?.location || '')}&returnUrl=${encodeURIComponent(returnUrl || '')}`;

        res.redirect(redirectPath);

    } catch (err) {
        console.error('OAuth Error:', err.response?.data || err.message);
        const frontendUrl = getConfiguredFrontendUrl();
        res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
};

module.exports = {
    startOAuth,
    handleOAuthCallback,
    renderSandboxLogin,
    handleSandboxComplete
};
