// utils/otpUtils.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate random OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};
    
// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP - Volunteer Application',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Email Verification</h2>
                    <p>Thank you for your volunteer application! Please use the following OTP to verify your email address:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #e74c3c; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Store OTP with expiration (10 minutes)
const storeOTP = (email, otp) => {
    otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
};

// Verify OTP
const verifyOTP = (email, otp) => {
    const storedData = otpStore.get(email);
    
    if (!storedData) {
        return { success: false, message: 'OTP not found or expired' };
    }

    if (Date.now() > storedData.expiresAt) {
        otpStore.delete(email);
        return { success: false, message: 'OTP has expired' };
    }

    if (storedData.otp !== otp) {
        return { success: false, message: 'Invalid OTP' };
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);
    return { success: true, message: 'OTP verified successfully' };
};

// Clean expired OTPs (optional cleanup function)
const cleanExpiredOTPs = () => {
    const now = Date.now();
    for (const [email, data] of otpStore.entries()) {
        if (now > data.expiresAt) {
            otpStore.delete(email);
        }
    }
};

// Run cleanup every hour
setInterval(cleanExpiredOTPs, 60 * 60 * 1000);

module.exports = {
    generateOTP,
    sendOTPEmail,
    storeOTP,
    verifyOTP,
    cleanExpiredOTPs
};