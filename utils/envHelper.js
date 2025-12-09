const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ensureJwtSecret = () => {
    // 1. Check if JWT_SECRET is already in process.env (e.g. from Docker -e flag)
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length > 20) {
        return; // Already set and looks secure enough
    }

    const envPath = path.join(__dirname, '../.env');
    let envContent = '';

    // 2. Check if .env file exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    } else {
        // Create it if it doesn't exist
        console.log('Creating .env file...');
    }

    // 3. Check if JWT_SECRET is in the file content
    // (We check file content specifically because process.env might have loaded a partial/default)
    if (envContent.includes('JWT_SECRET=')) {
        // It exists in file. Let's assume it's valid, or we could regex check length.
        // For now, if key exists, we don't overwrite to be safe.
        // But if it's empty 'JWT_SECRET=', we might want to fill it.
        const match = envContent.match(/JWT_SECRET=(.*)/);
        if (match && match[1] && match[1].trim().length > 0) {
            return;
        }
    }

    // 4. Generate new Secret
    const newSecret = crypto.randomBytes(64).toString('hex');
    console.log('Generating new secure JWT_SECRET...');

    // 5. Append or Replace
    if (envContent.includes('JWT_SECRET=')) {
        // Replace empty definition
        envContent = envContent.replace(/JWT_SECRET=\s*/g, `JWT_SECRET=${newSecret}\n`);
    } else {
        // Append new definition
        envContent += `\nJWT_SECRET=${newSecret}\n`;
    }

    try {
        fs.writeFileSync(envPath, envContent.trim() + '\n');
        console.log('✅ JWT_SECRET auto-generated and saved to .env');

        // IMPORTANT: Update process.env for the immediate runtime
        process.env.JWT_SECRET = newSecret;
    } catch (err) {
        console.error('⚠️ Could not write to .env file. Using valid secret for this session only (users will be logged out on restart).');
        process.env.JWT_SECRET = newSecret;
    }
};

module.exports = { ensureJwtSecret };
