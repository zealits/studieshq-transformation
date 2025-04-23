const nodemailer = require("nodemailer");

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: process.env.SMPT_PORT,
  secure: true,
  service: process.env.SMPT_SERVICE,
  auth: {
    user: process.env.SMPT_MAIL,
    pass: process.env.SMPT_PASSWORD,
  },
});

/**
 * Send verification email to user
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} verificationToken - Verification token
 * @returns {Promise} - Nodemailer info object
 */
exports.sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Please Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">StudiesHQ</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with StudiesHQ. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The StudiesHQ Team</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; ${new Date().getFullYear()} StudiesHQ. All rights reserved.</p>
          <p>If you have any questions, please contact our support team at <a href="mailto:support@studieshq.com" style="color: #4f46e5;">support@studieshq.com</a></p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email to user
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} resetToken - Reset token
 * @returns {Promise} - Nodemailer info object
 */
exports.sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">StudiesHQ</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The StudiesHQ Team</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; ${new Date().getFullYear()} StudiesHQ. All rights reserved.</p>
          <p>If you have any questions, please contact our support team at <a href="mailto:support@studieshq.com" style="color: #4f46e5;">support@studieshq.com</a></p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send welcome email to user after verification
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @returns {Promise} - Nodemailer info object
 */
exports.sendWelcomeEmail = async (email, name) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Welcome to StudiesHQ!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">StudiesHQ</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining StudiesHQ. Your account has been verified and is now active.</p>
          <p>You can now log in and start using our platform to connect with freelancers or find projects that match your skills.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In to Your Account</a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The StudiesHQ Team</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; ${new Date().getFullYear()} StudiesHQ. All rights reserved.</p>
          <p>If you have any questions, please contact our support team at <a href="mailto:support@studieshq.com" style="color: #4f46e5;">support@studieshq.com</a></p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};
