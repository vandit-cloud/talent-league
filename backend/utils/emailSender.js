const nodemailer = require('nodemailer');

const createTransporter = async () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
        return {
            transporter: nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            }),
            from: emailUser
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
    const { transporter, from } = await createTransporter();
    const info = await transporter.sendMail({
        from,
        to,
        subject,
        html
    });

    return {
        info,
        previewUrl: nodemailer.getTestMessageUrl(info) || undefined
    };
};

module.exports = {
    sendHtmlEmail
};
