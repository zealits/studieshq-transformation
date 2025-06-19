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

// Common email template wrapper
const getEmailTemplate = (title, content, buttonText = null, buttonUrl = null) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">StudiesHQ</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2>${title}</h2>
        ${content}
        ${
          buttonText && buttonUrl
            ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${buttonUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">${buttonText}</a>
          </div>
        `
            : ""
        }
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>&copy; ${new Date().getFullYear()} StudiesHQ. All rights reserved.</p>
        <p>If you have any questions, please contact our support team at <a href="mailto:support@studieshq.com" style="color: #4f46e5;">support@studieshq.com</a></p>
      </div>
    </div>
  `;
};

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
  }/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  const content = `
    <p>Hello ${name},</p>
    <p>Thank you for registering with StudiesHQ. Please verify your email address by clicking the button below:</p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #4f46e5;">${verificationUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not create an account, please ignore this email.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Please Verify Your Email Address",
    html: getEmailTemplate("Please Verify Your Email Address", content, "Verify Email Address", verificationUrl),
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

  const content = `
    <p>Hello ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p>Or copy and paste this link in your browser:</p>
    <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Password Reset Request",
    html: getEmailTemplate("Password Reset Request", content, "Reset Password", resetUrl),
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

  const content = `
    <p>Welcome, ${name}!</p>
    <p>Thank you for joining StudiesHQ. Your account has been verified and is now active.</p>
    <p>You can now log in and start using our platform to connect with freelancers or find projects that match your skills.</p>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: "Welcome to StudiesHQ!",
    html: getEmailTemplate("Welcome to StudiesHQ!", content, "Log In to Your Account", loginUrl),
  };

  return await transporter.sendMail(mailOptions);
};

// ======================= CLIENT NOTIFICATIONS =======================

/**
 * Send new proposal notification to client
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} job - Job object
 * @param {Object} proposal - Proposal object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendNewProposalNotification = async (client, freelancer, job, proposal) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/jobs/${job._id}`;

  const content = `
    <p>Hello ${client.name},</p>
    <p>Great news! You've received a new proposal for your project "<strong>${job.title}</strong>".</p>
    
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">Proposal Details:</h3>
      <p><strong>Freelancer:</strong> ${freelancer.name}</p>
      <p><strong>Bid Amount:</strong> $${proposal.bidPrice}</p>
      <p><strong>Estimated Duration:</strong> ${proposal.estimatedDuration}</p>
      <p><strong>Cover Letter:</strong></p>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #4f46e5; margin: 10px 0;">${proposal.coverLetter}</p>
    </div>
    
    <p>Review the full proposal and freelancer profile to make an informed decision.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `New Proposal Received for "${job.title}"`,
    html: getEmailTemplate("New Proposal Received!", content, "View Proposal", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send freelancer hired notification to client
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} project - Project object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendFreelancerHiredNotification = async (client, freelancer, project) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/projects/${project._id}`;

  const content = `
    <p>Hello ${client.name},</p>
    <p>Congratulations! You have successfully hired <strong>${freelancer.name}</strong> for your project "<strong>${
    project.title
  }</strong>".</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Project Details:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Freelancer:</strong> ${freelancer.name}</p>
      <p><strong>Budget:</strong> $${project.budget}</p>
      <p><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString()}</p>
    </div>
    
    <p>The project is now in progress. You can track milestones, communicate with your freelancer, and manage payments through your project dashboard.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `Freelancer Hired for "${project.title}"`,
    html: getEmailTemplate("Freelancer Successfully Hired!", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send milestone completed notification to client
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendMilestoneCompletedNotification = async (client, freelancer, project, milestone) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/projects/${project._id}`;

  const content = `
    <p>Hello ${client.name},</p>
    <p><strong>${freelancer.name}</strong> has completed a milestone for your project "<strong>${
    project.title
  }</strong>" and submitted it for your review.</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Milestone Details:</h3>
      <p><strong>Milestone:</strong> ${milestone.title}</p>
      <p><strong>Amount:</strong> $${milestone.amount}</p>
      <p><strong>Completion Date:</strong> ${new Date(
        milestone.submissionDate || milestone.completedAt || Date.now()
      ).toLocaleDateString()}</p>
      ${
        milestone.submissionDetails
          ? `<p><strong>Submission Details:</strong></p>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #3b82f6; margin: 10px 0;">${milestone.submissionDetails}</p>`
          : ""
      }
    </div>
    
    <p>Please review the milestone deliverables and approve or request revisions as needed. Upon approval, payment will be released to the freelancer.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `Milestone Completed - "${milestone.title}"`,
    html: getEmailTemplate("Milestone Completed - Review Required", content, "Review Milestone", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send payment transaction notification to client
 * @param {Object} client - Client user object
 * @param {Object} transaction - Transaction object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendClientPaymentNotification = async (client, transaction) => {
  const paymentsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/payments`;

  let title, content, bgColor, borderColor;

  switch (transaction.type) {
    case "deposit":
      title = "Funds Added Successfully";
      bgColor = "#f0fdf4";
      borderColor = "#10b981";
      content = `
        <p>Hello ${client.name},</p>
        <p>Your wallet has been successfully credited with <strong>$${transaction.amount}</strong>.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
        </div>
        <p>You can now use these funds to post projects and hire freelancers.</p>
      `;
      break;

    case "payment":
      title = "Payment Processed";
      bgColor = "#fef3c7";
      borderColor = "#f59e0b";
      content = `
        <p>Hello ${client.name},</p>
        <p>A payment of <strong>$${transaction.amount}</strong> has been processed from your account.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Description:</strong> ${transaction.description || "Project payment"}</p>
        </div>
        <p>This payment has been transferred to your freelancer upon milestone completion.</p>
      `;
      break;

    case "refund":
      title = "Refund Processed";
      bgColor = "#dbeafe";
      borderColor = "#3b82f6";
      content = `
        <p>Hello ${client.name},</p>
        <p>A refund of <strong>$${transaction.amount}</strong> has been processed to your account.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Reason:</strong> ${transaction.description || "Project cancellation"}</p>
        </div>
        <p>The refund has been credited to your wallet and is available for immediate use.</p>
      `;
      break;

    default:
      title = "Payment Transaction Update";
      bgColor = "#f3f4f6";
      borderColor = "#6b7280";
      content = `
        <p>Hello ${client.name},</p>
        <p>A payment transaction has been processed on your account.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
      `;
  }

  content += `<p>Best regards,<br>The StudiesHQ Team</p>`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: title,
    html: getEmailTemplate(title, content, "View Payments", paymentsUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send job budget blocked notification to client
 * @param {Object} client - Client user object
 * @param {Object} job - Job object
 * @param {number} blockedAmount - Amount blocked
 * @returns {Promise} - Nodemailer info object
 */
exports.sendJobBudgetBlockedNotification = async (client, job, blockedAmount) => {
  const jobUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/jobs/${job._id}`;

  const content = `
    <p>Hello ${client.name},</p>
    <p>Your job "<strong>${job.title}</strong>" has been posted successfully, and <strong>$${blockedAmount}</strong> has been reserved from your wallet as security for this project.</p>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">Budget Details:</h3>
      <p><strong>Job:</strong> ${job.title}</p>
      <p><strong>Blocked Amount:</strong> $${blockedAmount}</p>
      <p><strong>Budget Range:</strong> $${job.budget.min} - $${job.budget.max}</p>
      <p><strong>Status:</strong> Funds Reserved</p>
    </div>
    
    <p>These funds will remain blocked until you hire a freelancer or cancel the job. Once you hire a freelancer, the funds will be transferred to escrow for the project.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `Job Posted - Budget Reserved for "${job.title}"`,
    html: getEmailTemplate("Job Posted Successfully", content, "View Job", jobUrl),
  };

  return await transporter.sendMail(mailOptions);
};

// ======================= FREELANCER NOTIFICATIONS =======================

/**
 * Send proposal status update notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} job - Job object
 * @param {Object} proposal - Proposal object
 * @param {string} oldStatus - Previous status
 * @returns {Promise} - Nodemailer info object
 */
exports.sendProposalStatusNotification = async (freelancer, job, proposal, oldStatus) => {
  const proposalUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/proposals`;

  let title, content, bgColor, borderColor;

  switch (proposal.status) {
    case "accepted":
      title = "Proposal Accepted - Congratulations!";
      bgColor = "#f0fdf4";
      borderColor = "#10b981";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>🎉 Congratulations! Your proposal for "<strong>${job.title}</strong>" has been accepted!</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <h3 style="margin: 0 0 10px 0; color: #059669;">Project Details:</h3>
          <p><strong>Project:</strong> ${job.title}</p>
          <p><strong>Your Bid:</strong> $${proposal.bidPrice}</p>
          <p><strong>Estimated Duration:</strong> ${proposal.estimatedDuration}</p>
          <p><strong>Client:</strong> Will be shared in project dashboard</p>
        </div>
        <p>The client will soon create a project and set up milestones. You'll receive another notification once the project is ready to start.</p>
      `;
      break;

    case "rejected":
      title = "Proposal Update";
      bgColor = "#fef2f2";
      borderColor = "#ef4444";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Thank you for your interest in "<strong>${job.title}</strong>". Unfortunately, your proposal was not selected this time.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Project:</strong> ${job.title}</p>
          <p><strong>Your Bid:</strong> $${proposal.bidPrice}</p>
        </div>
        <p>Don't be discouraged! Keep applying to projects that match your skills. There are many opportunities waiting for you.</p>
      `;
      break;

    case "shortlisted":
      title = "Great News - You've Been Shortlisted!";
      bgColor = "#eff6ff";
      borderColor = "#3b82f6";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Great news! Your proposal for "<strong>${job.title}</strong>" has been shortlisted by the client.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Proposal Details:</h3>
          <p><strong>Project:</strong> ${job.title}</p>
          <p><strong>Your Bid:</strong> $${proposal.bidPrice}</p>
          <p><strong>Status:</strong> Shortlisted</p>
        </div>
        <p>You're one step closer to getting hired! The client is reviewing shortlisted proposals and will make their final decision soon.</p>
      `;
      break;

    default:
      title = "Proposal Status Updated";
      bgColor = "#f3f4f6";
      borderColor = "#6b7280";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Your proposal status for "<strong>${job.title}</strong>" has been updated.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Project:</strong> ${job.title}</p>
          <p><strong>New Status:</strong> ${proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</p>
        </div>
      `;
  }

  content += `<p>Best regards,<br>The StudiesHQ Team</p>`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: title,
    html: getEmailTemplate(title, content, "View Proposals", proposalUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send new milestone created notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} client - Client user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendNewMilestoneNotification = async (freelancer, client, project, milestone) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/projects/${project._id}`;

  const content = `
    <p>Hello ${freelancer.name},</p>
    <p>A new milestone has been created for your project "<strong>${project.title}</strong>" by ${client.name}.</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Milestone Details:</h3>
      <p><strong>Title:</strong> ${milestone.title}</p>
      <p><strong>Description:</strong> ${milestone.description}</p>
      <p><strong>Amount:</strong> $${milestone.amount}</p>
      <p><strong>Due Date:</strong> ${new Date(milestone.dueDate).toLocaleDateString()}</p>
      <p><strong>Percentage:</strong> ${milestone.percentage}%</p>
    </div>
    
    <p>You can start working on this milestone immediately. Once completed, submit it for client review to receive payment.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: `New Milestone Created - "${milestone.title}"`,
    html: getEmailTemplate("New Milestone Created", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send payment notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} transaction - Transaction object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendFreelancerPaymentNotification = async (freelancer, transaction) => {
  const paymentsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/payments`;

  let title, content, bgColor, borderColor;

  switch (transaction.type) {
    case "milestone":
    case "payment":
      title = "Payment Received!";
      bgColor = "#f0fdf4";
      borderColor = "#10b981";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>🎉 Great news! You've received a payment of <strong>$${
          transaction.netAmount || transaction.amount
        }</strong>.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <h3 style="margin: 0 0 10px 0; color: #059669;">Payment Details:</h3>
          <p><strong>Amount Received:</strong> $${transaction.netAmount || transaction.amount}</p>
          ${transaction.fee ? `<p><strong>Platform Fee:</strong> $${transaction.fee}</p>` : ""}
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Description:</strong> ${transaction.description || "Milestone payment"}</p>
        </div>
        <p>The payment has been added to your wallet. You can withdraw it anytime through your payments dashboard.</p>
      `;
      break;

    case "withdrawal":
      title = "Withdrawal Processed";
      bgColor = "#eff6ff";
      borderColor = "#3b82f6";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Your withdrawal request of <strong>$${transaction.amount}</strong> has been processed successfully.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</p>
        </div>
        <p>The funds should appear in your designated payment method within 1-3 business days.</p>
      `;
      break;

    default:
      title = "Payment Transaction Update";
      bgColor = "#f3f4f6";
      borderColor = "#6b7280";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>A payment transaction has been processed on your account.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Amount:</strong> $${transaction.amount}</p>
          <p><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
      `;
  }

  content += `<p>Best regards,<br>The StudiesHQ Team</p>`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: title,
    html: getEmailTemplate(title, content, "View Payments", paymentsUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send gift card notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} giftCard - Gift card object
 * @param {string} action - Action type (received, redeemed, etc.)
 * @returns {Promise} - Nodemailer info object
 */
exports.sendGiftCardNotification = async (freelancer, giftCard, action = "received") => {
  const paymentsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/payments`;

  let title, content, bgColor, borderColor;

  switch (action) {
    case "received":
      title = "Gift Card Received!";
      bgColor = "#fef3c7";
      borderColor = "#f59e0b";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>🎁 Congratulations! You've received a gift card worth <strong>$${giftCard.amount}</strong>!</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">Gift Card Details:</h3>
          <p><strong>Value:</strong> $${giftCard.amount}</p>
          <p><strong>Brand:</strong> ${giftCard.brand || "Various Retailers"}</p>
          <p><strong>Gift Card ID:</strong> ${giftCard.id || giftCard.giftCardId}</p>
          <p><strong>Status:</strong> Ready to Use</p>
        </div>
        <p>Your gift card is ready to use! You can redeem it through your payments dashboard.</p>
      `;
      break;

    case "redeemed":
      title = "Gift Card Redeemed Successfully";
      bgColor = "#f0fdf4";
      borderColor = "#10b981";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Your gift card worth <strong>$${giftCard.amount}</strong> has been redeemed successfully!</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Value:</strong> $${giftCard.amount}</p>
          <p><strong>Redeemed:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>
        <p>Your gift card has been processed and you should receive it according to the delivery method selected.</p>
      `;
      break;

    case "expired":
      title = "Gift Card Expired";
      bgColor = "#fef2f2";
      borderColor = "#ef4444";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Unfortunately, your gift card worth <strong>$${giftCard.amount}</strong> has expired.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Value:</strong> $${giftCard.amount}</p>
          <p><strong>Expired:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Please contact our support team if you believe this is an error.</p>
      `;
      break;

    default:
      title = "Gift Card Update";
      bgColor = "#f3f4f6";
      borderColor = "#6b7280";
      content = `
        <p>Hello ${freelancer.name},</p>
        <p>Your gift card has been updated.</p>
        <div style="background-color: ${bgColor}; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
          <p><strong>Value:</strong> $${giftCard.amount}</p>
          <p><strong>Action:</strong> ${action.charAt(0).toUpperCase() + action.slice(1)}</p>
        </div>
      `;
  }

  content += `<p>Best regards,<br>The StudiesHQ Team</p>`;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: title,
    html: getEmailTemplate(title, content, "View Gift Cards", paymentsUrl),
  };

  return await transporter.sendMail(mailOptions);
};

// ======================= MILESTONE NOTIFICATIONS =======================

/**
 * Send milestone approved notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} client - Client user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendMilestoneApprovedNotification = async (freelancer, client, project, milestone) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/projects/${project._id}`;

  const content = `
    <p>Hello ${freelancer.name},</p>
    <p>🎉 Excellent work! Your milestone "<strong>${milestone.title}</strong>" has been approved by ${client.name}.</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Milestone Details:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Milestone:</strong> ${milestone.title}</p>
      <p><strong>Amount:</strong> $${milestone.amount}</p>
      <p><strong>Approved:</strong> ${new Date().toLocaleString()}</p>
      ${
        milestone.approvalComment
          ? `<p><strong>Client Feedback:</strong></p>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #10b981; margin: 10px 0;">${milestone.approvalComment}</p>`
          : ""
      }
    </div>
    
    <p>Payment for this milestone will be processed and added to your wallet shortly. Keep up the great work!</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: `Milestone Approved - "${milestone.title}"`,
    html: getEmailTemplate("Milestone Approved!", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send milestone revision requested notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} client - Client user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendMilestoneRevisionNotification = async (freelancer, client, project, milestone) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/projects/${project._id}`;

  const content = `
    <p>Hello ${freelancer.name},</p>
    <p>${client.name} has requested revisions for the milestone "<strong>${milestone.title}</strong>".</p>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">Revision Details:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Milestone:</strong> ${milestone.title}</p>
      <p><strong>Amount:</strong> $${milestone.amount}</p>
      ${
        milestone.feedback
          ? `<p><strong>Revision Feedback:</strong></p>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #f59e0b; margin: 10px 0;">${milestone.feedback}</p>`
          : ""
      }
    </div>
    
    <p>Please review the feedback and make the necessary changes. Once you've addressed the concerns, resubmit the milestone for approval.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: `Revision Requested - "${milestone.title}"`,
    html: getEmailTemplate("Milestone Revision Requested", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Generic email notification function
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} title - Email title
 * @param {string} content - Email content
 * @param {string} buttonText - Optional button text
 * @param {string} buttonUrl - Optional button URL
 * @returns {Promise} - Nodemailer info object
 */
exports.sendGenericNotification = async (email, subject, title, content, buttonText = null, buttonUrl = null) => {
  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: email,
    subject: subject,
    html: getEmailTemplate(title, content, buttonText, buttonUrl),
  };

  return await transporter.sendMail(mailOptions);
};

// ======================= ESCROW & PROJECT COMPLETION NOTIFICATIONS =======================

/**
 * Send escrow payment release notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} client - Client user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @param {Object} transaction - Transaction object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendEscrowPaymentReleaseNotification = async (freelancer, client, project, milestone, transaction) => {
  const paymentsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/payments`;

  const content = `
    <p>Hello ${freelancer.name},</p>
    <p>🎉 Great news! Your milestone payment has been released from escrow and added to your wallet!</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Payment Release Details:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Milestone:</strong> ${milestone.title}</p>
      <p><strong>Gross Amount:</strong> $${transaction.amount}</p>
      <p><strong>Platform Fee:</strong> $${transaction.fee}</p>
      <p><strong>Net Amount Received:</strong> $${transaction.netAmount}</p>
      <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
      <p><strong>Released:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
    </div>
    
    <p>The payment has been automatically released from escrow after client approval and is now available in your wallet. You can withdraw these funds anytime through your payments dashboard.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: `Escrow Payment Released - "${milestone.title}"`,
    html: getEmailTemplate("Escrow Payment Released!", content, "View Payments", paymentsUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send escrow payment release notification to client
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} project - Project object
 * @param {Object} milestone - Milestone object
 * @param {Object} transaction - Transaction object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendClientEscrowPaymentNotification = async (client, freelancer, project, milestone, transaction) => {
  const paymentsUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/payments`;

  const content = `
    <p>Hello ${client.name},</p>
    <p>Payment for the completed milestone has been successfully released from escrow to ${freelancer.name}.</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Payment Release Details:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Milestone:</strong> ${milestone.title}</p>
      <p><strong>Amount Released:</strong> $${transaction.amount}</p>
      <p><strong>Freelancer Received:</strong> $${transaction.metadata?.freelancerReceived || transaction.netAmount}</p>
      <p><strong>Platform Fee:</strong> $${transaction.metadata?.platformFee || transaction.fee}</p>
      <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
      <p><strong>Released:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
    </div>
    
    <p>This payment was automatically released from escrow after you approved the milestone. The freelancer has received their payment minus the platform fee.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `Payment Released from Escrow - "${milestone.title}"`,
    html: getEmailTemplate("Payment Released from Escrow", content, "View Payments", paymentsUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send project completion notification to client
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} project - Project object
 * @param {Object} escrowData - Escrow completion data
 * @returns {Promise} - Nodemailer info object
 */
exports.sendProjectCompletionNotificationToClient = async (client, freelancer, project, escrowData) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/client/projects/${project._id}`;

  const content = `
    <p>Hello ${client.name},</p>
    <p>🎉 Congratulations! Your project "<strong>${project.title}</strong>" has been completed successfully!</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Project Completion Summary:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Freelancer:</strong> ${freelancer.name}</p>
      <p><strong>Total Project Value:</strong> $${escrowData.totalAmount}</p>
      <p><strong>Total Paid to Freelancer:</strong> $${escrowData.amountToFreelancer}</p>
      <p><strong>Platform Fees:</strong> $${escrowData.platformRevenue}</p>
      <p><strong>Completed:</strong> ${new Date(project.completedDate).toLocaleString()}</p>
      <p><strong>Total Milestones:</strong> ${project.milestones?.length || 0}</p>
    </div>
    
    <p>All milestones have been completed and approved. All payments have been released from escrow to the freelancer. Thank you for using StudiesHQ!</p>
    <p>We'd love to hear about your experience. Please consider leaving feedback for ${freelancer.name}.</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: client.email,
    subject: `Project Completed - "${project.title}"`,
    html: getEmailTemplate("🎉 Project Completed Successfully!", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send project completion notification to freelancer
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} client - Client user object
 * @param {Object} project - Project object
 * @param {Object} escrowData - Escrow completion data
 * @returns {Promise} - Nodemailer info object
 */
exports.sendProjectCompletionNotificationToFreelancer = async (freelancer, client, project, escrowData) => {
  const projectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/freelancer/projects/${project._id}`;

  const content = `
    <p>Hello ${freelancer.name},</p>
    <p>🎉 Congratulations! You've successfully completed the project "<strong>${project.title}</strong>" for ${client.name}!</p>
    
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Project Completion Summary:</h3>
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Client:</strong> ${client.name}</p>
      <p><strong>Total Project Value:</strong> $${escrowData.totalAmount}</p>
      <p><strong>Your Total Earnings:</strong> $${escrowData.amountToFreelancer}</p>
      <p><strong>Platform Fees Deducted:</strong> $${escrowData.platformRevenue / 2}</p>
      <p><strong>Completed:</strong> ${new Date(project.completedDate).toLocaleString()}</p>
      <p><strong>Milestones Completed:</strong> ${project.milestones?.length || 0}</p>
    </div>
    
    <p>All your hard work has paid off! All milestone payments have been released from escrow and are now available in your wallet. You can withdraw these funds anytime.</p>
    <p>Thank you for delivering excellent work. Keep up the great job and look forward to more projects!</p>
    <p>Best regards,<br>The StudiesHQ Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ" <${process.env.SMPT_MAIL}>`,
    to: freelancer.email,
    subject: `Project Completed - "${project.title}"`,
    html: getEmailTemplate("🎉 Project Completed Successfully!", content, "View Project", projectUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send final escrow completion notification to both parties
 * @param {Object} client - Client user object
 * @param {Object} freelancer - Freelancer user object
 * @param {Object} project - Project object
 * @param {Object} escrowData - Escrow completion data
 * @returns {Promise} - Array of Nodemailer info objects
 */
exports.sendEscrowCompletionNotification = async (client, freelancer, project, escrowData) => {
  const clientPromise = exports.sendProjectCompletionNotificationToClient(client, freelancer, project, escrowData);
  const freelancerPromise = exports.sendProjectCompletionNotificationToFreelancer(freelancer, client, project, escrowData);

  return await Promise.all([clientPromise, freelancerPromise]);
};

// ======================= SUPPORT TICKET NOTIFICATIONS =======================

/**
 * Send new ticket notification to support team
 * @param {Object} ticket - Support ticket object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendNewTicketNotification = async (ticket) => {
  const ticketUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/support`;
  const supportEmail = process.env.SUPPORT_EMAIL || "support@studieshq.com";

  const content = `
    <p>A new support ticket has been submitted and requires attention.</p>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">Ticket Details:</h3>
      <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Category:</strong> ${ticket.category}</p>
      <p><strong>Priority:</strong> ${ticket.priority}</p>
      <p><strong>User:</strong> ${ticket.user.name} (${ticket.user.email})</p>
      <p><strong>User Role:</strong> ${ticket.user.role}</p>
      <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #374151;">Description:</h4>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #4f46e5; margin: 0;">${ticket.description}</p>
    </div>
    
    <p>Please review and respond to this ticket as soon as possible.</p>
    <p>StudiesHQ Support System</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ Support" <${process.env.SMPT_MAIL}>`,
    to: supportEmail,
    subject: `New Support Ticket: ${ticket.subject} (#${ticket.ticketNumber})`,
    html: getEmailTemplate("New Support Ticket Submitted", content, "View Ticket", ticketUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send ticket reply notification to user
 * @param {Object} user - User object
 * @param {Object} ticket - Support ticket object
 * @param {Object} reply - Ticket reply object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendTicketReplyNotification = async (user, ticket, reply) => {
  const ticketUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/${user.role}/support/tickets/${ticket._id}`;

  const content = `
    <p>Hello ${user.name},</p>
    <p>You have received a new reply to your support ticket.</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Ticket Information:</h3>
      <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Replied by:</strong> Support Team</p>
      <p><strong>Replied at:</strong> ${new Date(reply.createdAt).toLocaleString()}</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #374151;">Reply:</h4>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #4f46e5; margin: 0;">${reply.content}</p>
    </div>
    
    <p>You can view the full conversation and reply to this ticket through your support dashboard.</p>
    <p>Best regards,<br>The StudiesHQ Support Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ Support" <${process.env.SMPT_MAIL}>`,
    to: user.email,
    subject: `Support Reply: ${ticket.subject} (#${ticket.ticketNumber})`,
    html: getEmailTemplate("New Reply to Your Support Ticket", content, "View Ticket", ticketUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send user reply notification to support team
 * @param {Object} ticket - Support ticket object
 * @param {Object} reply - Ticket reply object
 * @returns {Promise} - Nodemailer info object
 */
exports.sendUserReplyNotification = async (ticket, reply) => {
  const ticketUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/support`;
  const supportEmail = process.env.SUPPORT_EMAIL || "support@studieshq.com";

  const content = `
    <p>A user has replied to support ticket #${ticket.ticketNumber} and requires attention.</p>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">Ticket Details:</h3>
      <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>User:</strong> ${ticket.user.name} (${ticket.user.email})</p>
      <p><strong>Replied at:</strong> ${new Date(reply.createdAt).toLocaleString()}</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #374151;">User's Reply:</h4>
      <p style="background-color: #ffffff; padding: 10px; border-left: 3px solid #4f46e5; margin: 0;">${reply.content}</p>
    </div>
    
    <p>Please review and respond to this ticket reply as soon as possible.</p>
    <p>StudiesHQ Support System</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ Support" <${process.env.SMPT_MAIL}>`,
    to: supportEmail,
    subject: `User Reply: ${ticket.subject} (#${ticket.ticketNumber})`,
    html: getEmailTemplate("User Replied to Support Ticket", content, "View Ticket", ticketUrl),
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send ticket status update notification to user
 * @param {Object} user - User object
 * @param {Object} ticket - Support ticket object
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {Promise} - Nodemailer info object
 */
exports.sendTicketStatusUpdateNotification = async (user, ticket, oldStatus, newStatus) => {
  const ticketUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/${user.role}/support/tickets/${ticket._id}`;

  let statusMessage = "";
  let statusColor = "#3b82f6";

  switch (newStatus) {
    case "in-progress":
      statusMessage = "Your ticket is now being worked on by our support team.";
      statusColor = "#f59e0b";
      break;
    case "waiting-for-response":
      statusMessage = "We need additional information from you to resolve your ticket.";
      statusColor = "#f59e0b";
      break;
    case "resolved":
      statusMessage = "Your ticket has been resolved! Please review the solution and let us know if you need further assistance.";
      statusColor = "#10b981";
      break;
    case "closed":
      statusMessage = "Your ticket has been closed. Thank you for contacting our support team.";
      statusColor = "#6b7280";
      break;
    default:
      statusMessage = `Your ticket status has been updated to ${newStatus}.`;
  }

  const content = `
    <p>Hello ${user.name},</p>
    <p>The status of your support ticket has been updated.</p>
    
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
      <h3 style="margin: 0 0 10px 0; color: #1d4ed8;">Status Update:</h3>
      <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Previous Status:</strong> ${oldStatus}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <p>${statusMessage}</p>
    
    <p>You can view the full details and conversation history through your support dashboard.</p>
    <p>Best regards,<br>The StudiesHQ Support Team</p>
  `;

  const mailOptions = {
    from: `"StudiesHQ Support" <${process.env.SMPT_MAIL}>`,
    to: user.email,
    subject: `Ticket Status Update: ${ticket.subject} (#${ticket.ticketNumber})`,
    html: getEmailTemplate("Support Ticket Status Updated", content, "View Ticket", ticketUrl),
  };

  return await transporter.sendMail(mailOptions);
};
