const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/user');
const cloudinary = require('cloudinary').v2;
const Courses = require('../Models/Course')
const NewStudentHanddle = require('../controllers/Newstudent')
const multer = require('multer');
const auth  = require('../middleware/auth');
const AdminAuth = require('../middleware/Admin');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Students = require('../Models/student');

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

Router.get('/logout', async (req, res) => {
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

Router.post('/studentadmission', AdminAuth, uploadsMiddleware.fields([{ name: 'Files' }]),NewStudentHanddle )

Router.get('/Allstudentdata', AdminAuth, async (req, res) => {
  try {
    const studentdata = await Students.find({}).exec();
    console.log("Student Data:", studentdata); // Add this line for debugging
    res.status(200).json({ data: studentdata, success: true });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ data: "Error fetching student data", success: false });
  }
});

Router.delete('/deleteStudent/:id', AdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Students.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({ success: true, data: deletedStudent });
  } catch (error) {
    console.error('Error deleting student data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// Add this route to fetch student data by ID
Router.get('/getStudent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const studentData = await Students.findById(id);

    if (!studentData) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.status(200).json({ success: true, data: studentData });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


Router.put('/updateStudent/:id', AdminAuth,  uploadsMiddleware.fields([{ name: 'Files' }]), async (req, res) =>{
  const { id } = req.params;
  try {
    const {
      firstName,
      lastName,
      course,
      phoneNumber,
      confirmPhoneNumber,
      email,
      dob,
      gender,
      occupation,
      state,
      city,
      postcode,
      address,
    } = req.body;

    const existingStudent = await Students.findById(id);

    if (!existingStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    if (req.files['Files']) {
      photoPath = req.files['Files'][0].path;
    }
    // Update the existing student properties
    existingStudent.firstname = firstName;
    existingStudent.lastname = lastName;
    existingStudent.course = course;
    existingStudent.Mobilenumber = phoneNumber;
    existingStudent.confirmnumber = confirmPhoneNumber;
    existingStudent.Email = email;
    existingStudent.Date_of_brith = dob;
    existingStudent.gender = gender;
    existingStudent.Occupation = occupation;
    existingStudent.State = state;
    existingStudent.City = city;
    existingStudent.Postcode = postcode;
    existingStudent.Address = address;
    existingStudent.photo = photoPath;
    // Save the updated student
    const updatedStudent = await existingStudent.save();

    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error('Error updating student data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});



module.exports = Router;
