const nodemailer = require('nodemailer');
require('dotenv').config()
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

// Create the OAuth2 client
const createTransporter = async () => {
  try {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error('Error getting access token:', err);
          reject(err);
        }
        resolve(token);
      });
    });

    console.log(accessToken)

     // Updated transporter configuration
     const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken
      },
      tls: {           // Added TLS options
        rejectUnauthorized: false
      }
    });


    // Verify the transporter
    await transporter.verify();
    console.log('Transporter verified successfully');
    
    return transporter;
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
};

// Function to send confirmation email
const sendConfirmationEmail = async (userEmail, confirmationToken) => {
  try {

    const confLink = process.env.environment === 'development'
      ? `http://localhost:3000/confirmation/${confirmationToken}`  // Fixed URL format
      : `https://touchstone-app-frontend.onrender.com/confirmation/${confirmationToken}`; // Added path

    const transporter = await createTransporter()
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: userEmail,
      subject: 'Confirm Your Email',
      html: `
        <h1>Welcome to Touchstone Logistics!</h1>
        <p>Please click the link below to confirm your email:</p>
        <a href=${confLink + confirmationToken}>Confirm Email</a>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendConfirmationEmail };