const Notification = require('../models/Notification');
const Beneficiary = require('../models/Beneficiary');
const Volunteer = require('../models/Volunteer');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Send notification to beneficiary
exports.sendNotification = async (req, res) => {
    try {
        const { id, titre, contenu } = req.body;

        // Validate input
        if (!id || !titre || !contenu) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        /*
         * 1. Check if the ID belongs to a Beneficiary
         */
        const beneficiary = await Beneficiary.findById(id);

        if (beneficiary) {

            const notification = new Notification({
                idBeneficiaire: beneficiary._id,
                idVolunteer: null,
                titre,
                contenu,
                dateEnvoi: new Date()
            });

            const savedNotification = await notification.save();

            // Add notification reference to beneficiary
            beneficiary.notifications.push(savedNotification._id);
            await beneficiary.save();

            return res.status(201).json({
                success: true,
                message: "Notification sent successfully",
                userType: "beneficiary",

                data: {
                    notification: savedNotification,

                    user: {
                        id: beneficiary._id,
                        name: beneficiary.name,
                        lastname: beneficiary.lastname,
                        email: beneficiary.email
                    }
                }
            });
        }

        /*
         * 2. Check if the ID belongs to a Volunteer
         */
        const volunteer = await Volunteer.findById(id);

        if (volunteer) {

            const notification = new Notification({
                idBeneficiaire: null,
                idVolunteer: volunteer._id,
                titre,
                contenu,
                dateEnvoi: new Date()
            });

            const savedNotification = await notification.save();

            // Add notification reference to volunteer
            volunteer.notifications.push(savedNotification._id);
            await volunteer.save();

            return res.status(201).json({
                success: true,
                message: "Notification sent successfully",
                userType: "volunteer",

                data: {
                    notification: savedNotification,

                    user: {
                        id: volunteer._id,
                        name: volunteer.name,
                        lastName: volunteer.lastName,
                        email: volunteer.email
                    }
                }
            });
        }

        /*
         * 3. ID doesn't belong to anyone
         */
        return res.status(404).json({
            success: false,
            message: "Beneficiary or Volunteer not found"
        });

    } catch (error) {
        console.error("Error sending notification:", error);

        return res.status(500).json({
            success: false,
            message: "Error sending notification",
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
exports.getNotificationsByUserId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        /*
         * 1. Check if ID belongs to a Beneficiary
         */
        const beneficiary = await Beneficiary.findById(id);

        if (beneficiary) {
            const notifications = await Notification.find({
                idBeneficiaire: id
            })
                .populate(
                    "idBeneficiaire",
                    "name lastname email phoneNumber"
                )
                .sort({ dateEnvoi: -1 });

            return res.status(200).json({
                success: true,
                userType: "beneficiary",
                count: notifications.length,
                user: {
                    id: beneficiary._id,
                    name: beneficiary.name,
                    lastname: beneficiary.lastname,
                    email: beneficiary.email
                },
                notifications
            });
        }

        /*
         * 2. Check if ID belongs to a Volunteer
         */
        const volunteer = await Volunteer.findById(id)
            .populate({
                path: "notifications",
                options: {
                    sort: { dateEnvoi: -1 }
                }
            });

        if (volunteer) {
            return res.status(200).json({
                success: true,
                userType: "volunteer",
                count: volunteer.notifications.length,
                user: {
                    id: volunteer._id,
                    name: volunteer.name,
                    lastName: volunteer.lastName,
                    email: volunteer.email
                },
                notifications: volunteer.notifications
            });
        }

        return res.status(404).json({
            success: false,
            message: "Beneficiary or Volunteer not found"
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);

        return res.status(500).json({
            success: false,
            message: "Error fetching notifications",
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const beneficiary = await Beneficiary.findById(id);

    if (beneficiary) {
      await Beneficiary.findByIdAndUpdate(
        id,
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
        userType: "beneficiary",
        message: "Toutes les notifications ont été marquées comme lues"
      });
    }

    const volunteer = await Volunteer.findById(id);

    if (volunteer) {
      await Volunteer.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            readNotifications: {
              $each: volunteer.notifications
            }
          }
        }
      );

      return res.status(200).json({
        success: true,
        userType: "volunteer",
        message: "Toutes les notifications ont été marquées comme lues"
      });
    }

    return res.status(404).json({
      success: false,
      message: "Beneficiary or Volunteer not found"
    });

  } catch (error) {
    console.error("Error marking notifications as read:", error);

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
