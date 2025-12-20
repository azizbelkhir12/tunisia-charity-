const Demande = require('../models/Demande');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Benevole = require('../models/Volunteer');
const nodemailer = require('nodemailer');



exports.requestOtp = async (req, res) => {
  try {
    const { name, Prenom, age, email, password, address, phone, gouvernorat, reason } = req.body;

    if (!name || !Prenom || !age || !email || !password || !address || !phone || !gouvernorat || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Demande.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 min

    // Hash password (before saving)
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Create demande in DB but mark as not verified yet
    const newDemande = new Demande({
      name: name.trim(),
      Prenom: Prenom.trim(),
      age,
      email: email.trim(),
      password: hashedPassword,
      address: address.trim(),
      phone: phone.trim(),
      gouvernorat: gouvernorat.trim(),
      reason: reason.trim(),
      otp,
      otpExpires,
      isVerified: false,
      status: 'pending',
    });

    await newDemande.save();

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // Send OTP email
    await transporter.sendMail({
      from: `"Volunteer Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code - Volunteer Verification',
      html: `
        <p>Hello ${Prenom},</p>
        <p>Thank you for your interest in volunteering.</p>
        <p>Your verification code is: <b>${otp}</b></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    console.log('✅ OTP sent to:', email);
    res.status(200).json({ message: 'OTP sent successfully. Please verify your email.' });
  } catch (err) {
    console.error('❌ Error sending OTP:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};





exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await Demande.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    if (Date.now() > user.otpExpires) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getAllDemandes = async (req, res) => {
    try {
      const demandes = await Demande.find();
      res.status(200).json(demandes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

exports.acceptDemande = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await Demande.findById(id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande not found' });
    }

    const existingBenevole = await Benevole.findOne({ email: demande.email });
    if (existingBenevole) {
      return res.status(400).json({ message: 'A volunteer with this email already exists' });
    }

    const newBenevole = new Benevole({
      name: demande.name,
      lastName: demande.Prenom,
      age: demande.age,
      email: demande.email,
      password: demande.password,
      address: demande.address,
      phone: demande.phone,
      gouvernorat: demande.gouvernorat,
      image: demande.image,
      status: 'active'
    });

    await newBenevole.save();
    await Demande.findByIdAndDelete(id);

    await sendAcceptanceEmail(newBenevole.email, `${newBenevole.name} ${newBenevole.lastName}`);

    res.status(200).json({
      message: 'Demande accepted, volunteer created, and demande deleted',
      benevole: newBenevole
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Reject a demande
exports.rejectDemande = async (req, res) => {
  try {
    const { id } = req.params;

    const demande = await Demande.findById(id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande not found' });
    }

    demande.status = 'rejected';
    await demande.save();

    await sendRejectionEmail(demande.email, `${demande.name} ${demande.Prenom}`);

    res.status(200).json({ message: 'Demande rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



  async function sendAcceptanceEmail(email, fullName) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Equipe Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '[- Votre demande de bénévolat a été acceptée !- ]',
    html: `
      <p>Bonjour ${Demande.fullName || fullName || ''},</p>
        <p>Nous avons le plaisir de vous informer que votre demande de bénévolat a été acceptée !</p>
        <p>Vous pouvez maintenant vous connecter à votre compte et commencer à contribuer à nos actions.</p>
        <p><a href="${process.env.FRONTEND_URL}/login">Se connecter</a></p>
        <br/>
        <p>Merci pour votre engagement,</p>
        <p>L'équipe Support Tunisia Charity</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

async function sendRejectionEmail(email, fullName) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Equipe Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '[- Votre demande de bénévolat n"a été pas acceptée -]',
    html: `
      <p>Bonjour ${Demande.fullName || fullName || ''},</p>
        <p>Malheuresement votre demande de bénévolat déposé via notre platforme n'a pas  été acceptée !</p>
        <p>Il semble que il y'a des erreurs dans votre demande. Si vous voulez plus d'informations n'hésite pas à nous contacter</p>
        <p><a href="${process.env.FRONTEND_URL}/contact">contacter-nous</a></p>
        <br/>
        <p>L'équipe Support Tunisia Charity</p>

    `
  };

  await transporter.sendMail(mailOptions);
}



