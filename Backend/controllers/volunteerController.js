const Volunteer = require('../models/Volunteer');

exports.getAllVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find().select('-password'); // Exclude passwords
        res.json(volunteers);
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getVolunteerById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find volunteer by ID
        const volunteer = await Volunteer.findById(id).select('-password'); // Exclude password

        // Check if volunteer exists
        if (!volunteer) {
            return res.status(404).json({
                status: 'fail',
                message: 'No volunteer found with that ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { volunteer }
        });
    } catch (error) {
        console.error('Error fetching volunteer:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: error.message
        });
    }
};

exports.changeVolunteerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting { status: 'active' or 'inactive' }

        // 1. Check if status is provided
        if (!status) {
            return res.status(400).json({
                status: 'fail',
                message: 'Status is required'
            });
        }
        // 2. Check if status is valid
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid status. Must be either "active" or "inactive"'
            });
        }

        // 3. Find volunteer and update status
        const volunteer = await Volunteer.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        // 4. Check if volunteer exists
        if (!volunteer) {
            return res.status(404).json({
                status: 'fail',
                message: 'No volunteer found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { volunteer }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: err.message
        });
    }
};

exports.updateVolunteer = async (req, res) => {
    try {
      const volunteer = await Volunteer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select('-password');
  
      if (!volunteer) {
        return res.status(404).json({
          status: 'fail',
          message: 'No volunteer found with that ID'
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: { volunteer }
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };
  

  exports.updatePhoto = async (req, res) => {
    try {
      if (!req.imgurUrl) {
        return res.status(400).json({ 
          success: false,
          message: 'Image non téléchargée' 
        });
      }
  
      const volunteer = await Volunteer.findByIdAndUpdate(
        req.params.id,
        { photoUrl: req.imgurUrl },
        { new: true }
      );
  
      if (!volunteer) {
        return res.status(404).json({ 
          success: false,
          message: 'Bénévole non trouvé' 
        });
      }
  
      res.json({
        success: true,
        message: 'Photo mise à jour avec succès',
        data: {
          photoUrl: req.imgurUrl,
          volunteer
        }
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo :', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur serveur',
        error: error.message 
      });
    }
  };

  

exports.updateVolunteerByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Champs autorisés à la modification
    const { name,lastName,age,email,phone,address,gouvernorat} = req.body;

    const updatedVolunteer = await Volunteer.findByIdAndUpdate(
      id,
      { name, lastName, age, email, phone, address,gouvernorat},
      { new: true, runValidators: true }
    );

    if (!updatedVolunteer) {
      return res.status(404).json({ message: 'Bénévole introuvable' });
    }

    res.status(200).json({
      message: 'Bénévole mis à jour avec succès',
      volunteer: updatedVolunteer
    });

  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du bénévole',
      error: error.message
    });
  }
};
