const Notification = require('../models/Notification');
const Beneficiary = require('../models/Beneficiary');
const nodemailer = require('nodemailer');

// Send notification to beneficiary
exports.sendNotification = async (req, res) => {
    try {
        const { idBeneficiaire, titre, contenu } = req.body;

        // Validate input
        if (!idBeneficiaire || !titre || !contenu) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Check if beneficiary exists
        const beneficiary = await Beneficiary.findById(idBeneficiaire);
        if (!beneficiary) {
            return res.status(404).json({ 
                success: false,
                message: 'Beneficiary not found' 
            });
        }

        // Create and save notification
        const notification = new Notification({
            idBeneficiaire,
            titre,
            contenu,
            dateEnvoi: new Date()
        });

        const savedNotification = await notification.save();

        // Add notification to beneficiary's notifications array
        beneficiary.notifications.push(savedNotification._id);
        await beneficiary.save();

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: {
                notification: savedNotification,
                beneficiary: {
                    id: beneficiary._id,
                    name: beneficiary.name,
                    lastname: beneficiary.lastname,
                    email: beneficiary.email
                }
            }
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error sending notification',
            error: error.message
        });
    }
};


exports.broadcastNotification = async (req, res) => {
    try {
        const { titre, contenu } = req.body;

        // Validate input
        if (!titre || !contenu) {
            return res.status(400).json({ 
                success: false,
                message: 'Title and content are required' 
            });
        }

        // Get all beneficiaries
        const beneficiaries = await Beneficiary.find();

        if (!beneficiaries || beneficiaries.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No beneficiaries found' 
            });
        }

        const broadcastDate = new Date();
        const notificationIds = [];
        const notifications = [];

        // Create a notification for each beneficiary
        for (const beneficiary of beneficiaries) {
            const notification = new Notification({
                idBeneficiaire: beneficiary._id,
                titre,
                contenu,
                dateEnvoi: broadcastDate
            });

            const savedNotification = await notification.save();
            notificationIds.push(savedNotification._id);
            notifications.push(savedNotification);

            // Add notification to beneficiary's notifications array
            beneficiary.notifications.push(savedNotification._id);
            await beneficiary.save();
        }

        res.status(201).json({
            success: true,
            message: `Notification broadcasted successfully to ${beneficiaries.length} beneficiaries`,
            data: {
                notificationsCount: notifications.length,
                broadcastDate
            }
        });

    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error broadcasting notification',
            error: error.message
        });
    }
};

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('idBeneficiaire', 'name lastname email phoneNumber')
            .sort({ dateEnvoi: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// Get all notifications for admin
exports.getNotificationsByBeneficiaryId = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the ID parameter
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Beneficiary ID is required'
            });
        }

        // Check if beneficiary exists
        const beneficiaryExists = await Beneficiary.findById(id);
        if (!beneficiaryExists) {
            return res.status(404).json({
                success: false,
                message: 'Beneficiary not found'
            });
        }

        // Get notifications for the specific beneficiary
        const notifications = await Notification.find({ idBeneficiaire: id })
            .populate('idBeneficiaire', 'name lastname email phoneNumber')
            .sort({ dateEnvoi: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            beneficiary: {
                id: beneficiaryExists._id,
                name: beneficiaryExists.name,
                lastname: beneficiaryExists.lastname,
                email: beneficiaryExists.email
            },
            notifications: notifications
        });

    } catch (error) {
        console.error('Error fetching notifications by beneficiary ID:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
    try {
        const totalNotifications = await Notification.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const notificationsToday = await Notification.countDocuments({
            dateEnvoi: { $gte: today }
        });
        
        const lastNotification = await Notification.findOne()
            .sort({ dateEnvoi: -1 })
            .populate('idBeneficiaire', 'name lastname');

        res.status(200).json({
            success: true,
            data: {
                totalNotifications,
                notificationsToday,
                lastNotification: lastNotification || null
            }
        });

    } catch (error) {
        console.error('Error fetching notification stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

// Search beneficiaries for notification
exports.searchBeneficiaries = async (req, res) => {
    try {
        const { searchTerm } = req.query;

        if (!searchTerm || searchTerm.length < 2) {
            return res.status(400).json({ 
                success: false,
                message: 'Search term must be at least 2 characters' 
            });
        }

        const beneficiaries = await Beneficiary.find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { lastname: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ]
        }).select('name lastname email phoneNumber gouvernorat');

        res.status(200).json({
            success: true,
            count: beneficiaries.length,
            data: beneficiaries
        });

    } catch (error) {
        console.error('Error searching beneficiaries:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error searching beneficiaries',
            error: error.message
        });
    }
};


exports.markAllNotificationsAsRead = async (req, res) => {
  try {

    const beneficiary =
      await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: "Beneficiary not found"
      });
    }

    await Beneficiary.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          readNotifications: {
            $each: beneficiary.notifications
          }
        }
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Toutes les notifications ont été marquées comme lues"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



exports.emailBeneficiary = async (req, res) => {
  const { email, broadcast } = req.body;

  try {
    let beneficiaries;

    if (broadcast) {
      // Fetch all beneficiaries
      beneficiaries = await Beneficiary.find({}, 'email firstName');
    } else {
      // Fetch a specific beneficiary
      const single = await Beneficiary.findOne({ email }, 'email firstName');
      if (!single) {
        return res.status(404).json({ message: 'Bénéficiaire non trouvé.' });
      }
      beneficiaries = [single];
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send emails
    for (const beneficiary of beneficiaries) {
      const htmlContent = `
        <p>Bonjour ${beneficiary.firstName || ''},</p>
        <p>Vous avez des nouveaux notification(s) disponible(s) dans votre compte sur la plateforme.</p>
        <p>Connectez-vous pour les consulter.</p>
        <br/>
        <p>Cordialement,<br/>L'équipe de la plateforme</p>
      `;

      await transporter.sendMail({
        from: `"Support" <${process.env.EMAIL_USER}>`,
        to: beneficiary.email,
        subject: '[- Nouvelles Notifications réçu ! Rendez-vous sur la plateforme -]',
        html: htmlContent
      });
    }

    res.status(200).json({
      message: broadcast
        ? 'Emails envoyés à tous les bénéficiaires.'
        : 'Email envoyé au bénéficiaire.'
    });
  } catch (error) {
    console.error('Erreur lors de l’envoi des notifications :', error);
    res.status(500).json({ message: 'Erreur du serveur.' });
  }
};
