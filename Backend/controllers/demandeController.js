const Demande = require('../models/Demande');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Benevole = require('../models/Volunteer');
const nodemailer = require('nodemailer');



exports.requestOtp = async (req, res) => {
  let normalizedEmail = '';

  try {
    console.log(
      'requestOtp body:',
      req.body
    );

    const {
      name,
      Prenom,
      age,
      email,
      password,
      address,
      phone,
      gouvernorat,
      reason,
    } = req.body || {};

    const cleanName =
      typeof name === 'string'
        ? name.trim()
        : '';

    const cleanPrenom =
      typeof Prenom === 'string'
        ? Prenom.trim()
        : '';

    normalizedEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : '';

    const cleanPassword =
      typeof password === 'string'
        ? password.trim()
        : '';

    const cleanAddress =
      typeof address === 'string'
        ? address.trim()
        : '';

    const cleanPhone =
      typeof phone === 'string'
        ? phone
            .replace(/\s/g, '')
            .trim()
        : '';

    const cleanGouvernorat =
      typeof gouvernorat === 'string'
        ? gouvernorat.trim()
        : '';

    const cleanReason =
      typeof reason === 'string'
        ? reason.trim()
        : '';

    const numericAge = Number(age);

    const missingFields = [];

    if (!cleanName) {
      missingFields.push('name');
    }

    if (!cleanPrenom) {
      missingFields.push('Prenom');
    }

    if (
      age === null ||
      age === undefined ||
      age === '' ||
      !Number.isFinite(numericAge)
    ) {
      missingFields.push('age');
    }

    if (!normalizedEmail) {
      missingFields.push('email');
    }

    if (!cleanPassword) {
      missingFields.push('password');
    }

    if (!cleanAddress) {
      missingFields.push('address');
    }

    if (!cleanPhone) {
      missingFields.push('phone');
    }

    if (!cleanGouvernorat) {
      missingFields.push('gouvernorat');
    }

    if (!cleanReason) {
      missingFields.push('reason');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message:
          'Tous les champs sont obligatoires.',
        missingFields
      });
    }

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 16 ||
      numericAge > 100
    ) {
      return res.status(400).json({
        message:
          "L'âge doit être compris entre 16 et 100 ans."
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message:
          'Adresse email invalide.'
      });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({
        message:
          'Le mot de passe doit contenir au moins 8 caractères.'
      });
    }

    const existingVerified =
      await Demande.findOne({
        email: normalizedEmail,
        isVerified: true
      });

    if (existingVerified) {
      return res.status(409).json({
        message:
          'Email already in use'
      });
    }

    /*
     * Supprime une ancienne demande
     * non vérifiée pour permettre
     * un nouvel envoi OTP.
     */
    await Demande.deleteMany({
      email: normalizedEmail,
      isVerified: false
    });

    const otp = Math.floor(
      100000 +
      Math.random() * 900000
    ).toString();

    const otpExpires = new Date(
      Date.now() +
      10 * 60 * 1000
    );

    const hashedPassword =
      await bcrypt.hash(
        cleanPassword,
        10
      );

    await Demande.create({
      name: cleanName,
      Prenom: cleanPrenom,
      age: numericAge,
      email: normalizedEmail,
      password: hashedPassword,
      address: cleanAddress,
      phone: cleanPhone,
      gouvernorat: cleanGouvernorat,
      reason: cleanReason,
      otp,
      otpExpires,
      isVerified: false,
      status: 'pending'
    });

    const transporter =
      nodemailer.createTransport({
        host:
          process.env.EMAIL_HOST,

        port:
          Number(
            process.env.EMAIL_PORT
          ),

        secure:
          process.env.EMAIL_SECURE ===
          'true',

        auth: {
          user:
            process.env.EMAIL_USER,

          pass:
            process.env.EMAIL_PASS
        }
      });

    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM,

      to:
        normalizedEmail,

      subject:
        'Votre code de vérification - Tunisia Charity',

      html: `
        <div
          style="
            max-width: 560px;
            margin: 0 auto;
            padding: 32px;
            font-family: Arial, sans-serif;
            color: #26302e;
            background-color: #ffffff;
            border: 1px solid #e4e0d9;
            border-radius: 16px;
          "
        >
          <h2
            style="
              margin: 0 0 20px;
              color: #1f4f7a;
            "
          >
            Vérification de votre adresse email
          </h2>

          <p>
            Bonjour ${cleanPrenom},
          </p>

          <p>
            Merci pour votre intérêt à
            rejoindre Tunisia Charity en
            tant que bénévole.
          </p>

          <p>
            Utilisez le code suivant pour
            vérifier votre adresse email :
          </p>

          <div
            style="
              margin: 24px 0;
              padding: 18px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1677ff;
              background-color: #f1efeb;
              border-radius: 12px;
            "
          >
            ${otp}
          </div>

          <p>
            Ce code expirera dans
            <strong>10 minutes</strong>.
          </p>

          <p
            style="
              color: #727b79;
              font-size: 14px;
            "
          >
            Si vous n'avez pas effectué
            cette demande, vous pouvez
            ignorer cet email.
          </p>

          <p style="margin-top: 28px;">
            Cordialement,<br />

            <strong>
              L'équipe Tunisia Charity
            </strong>
          </p>
        </div>
      `
    });

    console.log(
      'OTP envoyé à :',
      normalizedEmail
    );

    return res.status(200).json({
      message:
        'OTP sent successfully. Please verify your email.'
    });
  } catch (error) {
    console.error(
      'Error sending OTP:',
      error
    );

    if (normalizedEmail) {
      await Demande.deleteOne({
        email: normalizedEmail,
        isVerified: false
      }).catch(() => {});
    }

    return res.status(500).json({
      message:
        'Failed to send OTP',

      error:
        process.env.NODE_ENV ===
        'development'
          ? error.message
          : undefined
    });
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



