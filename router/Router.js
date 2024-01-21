const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const cloudinary = require('cloudinary').v2;
const Courses = require('../Models/Course')
const multer = require('multer');
const auth  = require('../middleware/auth');
const AdminAuth = require('../middleware/Admin');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const keys ="kci12345#$"
Router.get('/', (req, res) => {
  res.send("Nice working correctly");
});

Router.post('/resgition', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 8);
    const userdata = await User.create({
        Name: name,
        email: email,
        password: hashedPassword,
    });
    res.json({ data: userdata, success: true });
  } catch (error) {
    console.error("Error during user creation:", error);
    res.status(402).json({ data: "Something went wrong", success: false });
  }
});

Router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign({ _id: user._id.toString() },keys, {
      expiresIn: '2d',
    });

    // Save the token to the user's tokens array
    user.tokens = [{ token }];
    await user.save();

    if (user.isAdmin) {
      res.json({
        data: user,
        token,
        isAdmin: user.isAdmin,
       
        success: true,
      });
    } else {
      res.json({
        data: user,
        token,
        isAdmin: user.isAdmin,
       
        success: true,
      });
    }
  } catch (error) {
    res.status(401).json({ data: error.message, success: false });
  }
});

Router.get('/profile', auth, (req, res) => {
  res.json({ data: req.user, success: true });
});

Router.get('/userlogin', AdminAuth, async (req, res) => {
  try {
    const allUserData = await User.find({}).exec();
    res.json({ data: allUserData, success: true });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ data: "Something went wrong", success: false });
  }
});

Router.get('/logout', AdminAuth, async (req, res) => {
  try {
 

    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error("Error during admin logout:", error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'png', 'pdf'],
  },
});

const uploadsMiddleware = multer({ storage: cloudinaryStorage });

Router.post('/course', AdminAuth, uploadsMiddleware.fields([{ name: 'image' }, { name: 'pdf' }]), async (req, res) => {
  try {
    const { courseName, fees, duration } = req.body;
console.log("the value of ", req.body);
    // Access the uploaded files
    const imageFile = req.files['image'][0];
    const pdfFile = req.files['pdf'][0];

    const course = await Courses.create({
      Name: courseName,
      Fees: fees,
      Duration: duration,
      Image: imageFile.path,
      PDF: pdfFile.path,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error('Error in /course POST route:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


Router.get('/Allcoursedata', async (req, res) => {
  try {
    const Coursedata = await Courses.find({}).exec();
    res.status(200).json({ data: Coursedata, success: true });
  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).json({ data: "Error fetching course data", success: false });
  }
});


module.exports = Router;
