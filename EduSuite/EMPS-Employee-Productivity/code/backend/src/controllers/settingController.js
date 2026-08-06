const Setting = require('../models/Setting');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ isActive: true })
      .populate('updatedBy', 'firstName lastName employeeId');
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key, isActive: true })
      .populate('updatedBy', 'firstName lastName employeeId');
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setting'
    });
  }
};

// Create or update setting
exports.updateSetting = async (req, res) => {
  try {
    const { key, value, category, description } = req.body;
    
    let setting = await Setting.findOne({ key });
    
    if (setting) {
      setting.value = value;
      setting.category = category || setting.category;
      setting.description = description || setting.description;
      setting.updatedBy = req.user.id;
      await setting.save();
    } else {
      setting = new Setting({
        key,
        value,
        category: category || 'general',
        description,
        updatedBy: req.user.id,
        isActive: true
      });
      await setting.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOneAndUpdate(
      { key },
      { isActive: false },
      { new: true }
    );
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete setting'
    });
  }
};

// Get office location settings
exports.getOfficeLocation = async (req, res) => {
  try {
    const [latitude, longitude, radius] = await Promise.all([
      Setting.findOne({ key: 'office_latitude', isActive: true }),
      Setting.findOne({ key: 'office_longitude', isActive: true }),
      Setting.findOne({ key: 'office_radius', isActive: true })
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        latitude: latitude ? latitude.value : 0,
        longitude: longitude ? longitude.value : 0,
        radius: radius ? radius.value : 50
      }
    });
  } catch (error) {
    console.error('Get office location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get office location'
    });
  }
};

// Update office location settings
exports.updateOfficeLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.body;
    
    // Update or create latitude setting
    let latSetting = await Setting.findOne({ key: 'office_latitude' });
    if (latSetting) {
      latSetting.value = latitude;
      latSetting.updatedBy = req.user.id;
      await latSetting.save();
    } else {
      latSetting = new Setting({
        key: 'office_latitude',
        value: latitude,
        category: 'office',
        description: 'Office latitude for attendance location verification',
        updatedBy: req.user.id
      });
      await latSetting.save();
    }
    
    // Update or create longitude setting
    let longSetting = await Setting.findOne({ key: 'office_longitude' });
    if (longSetting) {
      longSetting.value = longitude;
      longSetting.updatedBy = req.user.id;
      await longSetting.save();
    } else {
      longSetting = new Setting({
        key: 'office_longitude',
        value: longitude,
        category: 'office',
        description: 'Office longitude for attendance location verification',
        updatedBy: req.user.id
      });
      await longSetting.save();
    }
    
    // Update or create radius setting
    let radiusSetting = await Setting.findOne({ key: 'office_radius' });
    if (radiusSetting) {
      radiusSetting.value = radius;
      radiusSetting.updatedBy = req.user.id;
      await radiusSetting.save();
    } else {
      radiusSetting = new Setting({
        key: 'office_radius',
        value: radius || 50,
        category: 'office',
        description: 'Office radius in meters for attendance location verification',
        updatedBy: req.user.id
      });
      await radiusSetting.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Office location updated successfully',
      data: {
        latitude: latSetting.value,
        longitude: longSetting.value,
        radius: radiusSetting.value
      }
    });
  } catch (error) {
    console.error('Update office location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update office location'
    });
  }
};