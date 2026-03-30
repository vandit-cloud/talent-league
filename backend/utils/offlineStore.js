const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure users.json exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

const getUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading offline users:', err);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error saving offline users:', err);
    }
};

const findUserByEmail = (email) => {
    const users = getUsers();
    return users.find(u => u.email === email);
};

const findUserById = (userId) => {
    const users = getUsers();
    return users.find((user) => user._id === userId);
};

const findUsersByEmail = (email) => {
    const users = getUsers();
    return users.filter((user) => user.email === email);
};

const findUserByResetToken = (hashedToken) => {
    const users = getUsers();
    const now = Date.now();

    return users.find((user) => {
        if (user.resetPasswordToken !== hashedToken || !user.resetPasswordExpires) {
            return false;
        }

        return new Date(user.resetPasswordExpires).getTime() > now;
    });
};

const addUser = (user) => {
    const users = getUsers();
    const newUser = {
        ...user,
        _id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
};

const updateUser = (userId, updates) => {
    const users = getUsers();
    const index = users.findIndex((user) => user._id === userId);

    if (index === -1) {
        return null;
    }

    users[index] = {
        ...users[index],
        ...updates
    };

    saveUsers(users);
    return users[index];
};

module.exports = {
    findUserByEmail,
    findUserById,
    findUsersByEmail,
    findUserByResetToken,
    addUser,
    updateUser
};
