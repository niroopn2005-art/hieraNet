import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Use a more persistent storage method (this is temporary, resets on server restart)
let otpStore: { [key: string]: { code: string; timestamp: number } } = {};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with timestamp
    otpStore[email] = {
      code: verificationCode,
      timestamp: Date.now(),
    };

    console.log('Stored OTP for', email, ':', verificationCode); // Debug log

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 32px;">${verificationCode}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { email, otp } = await req.json();
    console.log('Verifying OTP for', email, ':', otp); // Debug log
    console.log('Stored OTPs:', otpStore); // Debug log

    const storedData = otpStore[email];
    if (!storedData) {
      return NextResponse.json(
        { success: false, error: 'No OTP found for this email. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      delete otpStore[email];
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedData.code === otp) {
      delete otpStore[email]; // Clear OTP after successful verification
      return NextResponse.json({ 
        success: true,
        message: 'OTP verified successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid OTP. Please try again.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 