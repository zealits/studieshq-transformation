const nodemailer = require("nodemailer");

/**
 * Send email utility
 *
 * @param {Object} options - Email options
 * @param {String} options.email - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.message - Email content (plain text)
 * @param {String} options.html - Email content (HTML format, optional)
 * @returns {Promise} - Resolves with info about the sent email
 */
exports.sendEmail = async (options) => {
  // Create nodemailer transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    secure: process.env.SMPT_PORT === "465", // true for port 465
    service: process.env.SMPT_SERVICE,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  // Email options
  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  return info;
};
