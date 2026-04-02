const nodemailer = require('nodemailer');

const createTransporter = async () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
        return {
            transporter: nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            }),
            from: `"TalentLeague" <${emailUser}>`
        };
    }

    const testAccount = await nodemailer.createTestAccount();
    return {
        transporter: nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        }),
        from: '"TalentLeague" <no-reply@talentleague.dev>'
    };
};

const sendHtmlEmail = async ({ to, subject, html }) => {
    try {
        const { transporter, from } = await createTransporter();
        console.log(`[Email] Sending to: ${to}, subject: "${subject}", from: ${from}`);
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html
        });
        console.log(`[Email] Sent successfully. messageId: ${info.messageId}`);
        return {
            info,
            previewUrl: nodemailer.getTestMessageUrl(info) || undefined
        };
    } catch (error) {
        console.error(`[Email] FAILED to send to ${to}:`, error.message);
        throw error;
    }
};

module.exports = {
    sendHtmlEmail
};
