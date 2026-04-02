const nodemailer = require('nodemailer');

let brevoAvailable = false;
let BrevoClient = null;
try {
    BrevoClient = require('@getbrevo/brevo').BrevoClient;
    brevoAvailable = true;
} catch (e) {
    // Brevo not installed, will fall back to nodemailer
}

const sendViaBrevo = async ({ to, subject, html }) => {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey || !brevoAvailable) return null;

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'vvdoshi20@gmail.com';
    const client = new BrevoClient({ apiKey: brevoApiKey });

    console.log(`[Email] Sending via Brevo to: ${to}, subject: "${subject}"`);
    const result = await client.transactionalEmails.sendTransacEmail({
        sender: { name: 'TalentLeague', email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
    });
    console.log(`[Email] Brevo sent successfully. messageId: ${result?.messageId}`);
    return { info: result };
};

const sendViaNodemailer = async ({ to, subject, html }) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    let transporter, from;

    if (emailUser && emailPass) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { user: emailUser, pass: emailPass }
        });
        from = `"TalentLeague" <${emailUser}>`;
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });
        from = '"TalentLeague" <no-reply@talentleague.dev>';
    }

    console.log(`[Email] Sending via Nodemailer to: ${to}, subject: "${subject}", from: ${from}`);
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] Nodemailer sent successfully. messageId: ${info.messageId}`);
    return { info, previewUrl: nodemailer.getTestMessageUrl(info) || undefined };
};

const sendHtmlEmail = async ({ to, subject, html }) => {
    // Try Brevo first (more reliable from cloud servers), fall back to Nodemailer/Gmail
    try {
        const brevoResult = await sendViaBrevo({ to, subject, html });
        if (brevoResult) return brevoResult;
    } catch (error) {
        console.warn(`[Email] Brevo failed, falling back to Nodemailer:`, error.message);
    }

    try {
        return await sendViaNodemailer({ to, subject, html });
    } catch (error) {
        console.error(`[Email] FAILED to send to ${to}:`, error.message);
        throw error;
    }
};

module.exports = { sendHtmlEmail };
