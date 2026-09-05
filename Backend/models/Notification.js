const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    titre: {
        type: String,
        required: true
    },

    contenu: {
        type: String,
        required: true
    },

    idBeneficiaire: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Beneficiary',
        default: null
    },

    idVolunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volunteer',
        default: null
    },

    dateEnvoi: {
        type: Date,
        default: Date.now
    },

    lu: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model('Notification', notificationSchema);