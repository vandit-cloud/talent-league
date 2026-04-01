const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ENV_PATH = path.join(__dirname, '..', '.env');

const normalizePublicUrl = (value) => (value ? value.trim().replace(/\/+$/, '') : '');

const readEnvFile = () => {
    try {
        if (!fs.existsSync(ENV_PATH)) {
            return {};
        }

        return dotenv.parse(fs.readFileSync(ENV_PATH));
    } catch (error) {
        console.warn('Failed to read runtime env file:', error.message);
        return {};
    }
};

const getRuntimeEnvValue = (key) => {
    const fileEnv = readEnvFile();
    const fileValue = fileEnv[key];

    if (typeof fileValue === 'string' && fileValue.trim() !== '') {
        return fileValue;
    }

    return process.env[key];
};

const getRuntimePublicUrls = () => ({
    backendUrl: normalizePublicUrl(getRuntimeEnvValue('BACKEND_URL')),
    frontendUrl: normalizePublicUrl(getRuntimeEnvValue('FRONTEND_URL')),
});

module.exports = {
    getRuntimeEnvValue,
    getRuntimePublicUrls,
    normalizePublicUrl,
};
