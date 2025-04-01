const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail
    pass: process.env.EMAIL_PASS, // App Password
  },
});

// Function to send email
const sendConfirmationEmail = async (toEmail, confirmationCode, name) => {

  let confirmationUrl

  if (process.env.environment === 'development') {
    confirmationUrl = `http://localhost:3000/confirm/?code=${confirmationCode}`
  } else {
    confirmationUrl = `https://touchstone-app-frontend.onrender.com/confirm/?code=${confirmationCode}`
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Confirm Your Email | Touchstone Logistics",
    html: `<h2>Touchstone Invite for ${name}</h2>
           <p>Please confirm your email by clicking the link below:</p>
           <a href=${confirmationUrl}>Confirm Email</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendConfirmationEmail;
