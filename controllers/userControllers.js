const mongoose = require('mongoose')
const User = mongoose.model('user')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()


let verifyCodes = {}
const userControl = {
    sendVerificationCode: async (req, res) => {
        try {
            const email = req.body.email;
            const verifyCode = Array.from({ length: 6 }, () =>
                Math.floor(Math.random() * 10)
            ).join("");
            verifyCodes[email] = verifyCode;

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.REACT_APP_NODEMAILER_USER,
                    pass: process.env.REACT_APP_NODEMAILER_PASS,
                },
            });

            const mailOptions = {
                from: process.env.REACT_APP_NODEMAILER_USER,
                to: email,
                subject: "Verification Code",
                text: `Your verification code is: ${verifyCode}`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).send(`인증번호가 이메일로 전송되었습니다. ${verifyCode}`);
        } catch (error) {
            res.status(400).send("Invalid email address");
        }
    },
    verifyCode: (req, res) => {
        const { email, verificationCode } = req.body;

        if (verifyCodes[email] && verifyCodes[email] === verificationCode) {
            res.status(200).send("Verification successful");
        } else {
            res.status(400).send("Invalid verification code");
        }
    },
    register: async (req, res) => {
        try {
            const { name, email, password, sex, area, height, weight, age, exercise, wishList } = req.body;
            const hashPass = await bcrypt.hash(password, 10);
            const newUser = new User({
                name,
                email,
                password: hashPass,
                sex,
                area,
                height,
                weight,
                age,
                exercise,
                wishList,
            });
            await newUser.save();
            res.send('User saved to database');
        } catch (error) {
            res.status(400).send(error);
        }
    },
    login: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.email })
            if (!user) return res.status(401).json({ message: `Invalid email or password` })
            const isMatch = await bcrypt.compare(req.body.password, user.password)
            if (!isMatch) return res.status(401).json({
                message: `Invalid password`,
                email: req.body.email,
                pass: req.body.password,
                userPass: user.password
            })
            const token = jwt.sign({
                _id: user._id,
                email: user.email,
                name: user.name,
                currentTime: Math.floor(Date.now() / 1000)
            }, process.env.REACT_APP_JWT_SECRET)
            return res.json({ token })
        } catch (err) {
            console.error(err)
            return res.status(500).json({ message: `Internal Server Error` })
        }
    },
    getUserBasicInfo: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.REACT_APP_JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: err })
            const user = {
                name: decoded.name,
                email: decoded.email
            }
            res.json(user)
        })
    },
    getUserFullInfo: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
            const user = await User.findOne({ email: decoded.email });
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    getRecommendUsers: async (req, res) => {
        try {
            const users = await User.find({}, { password: 0 });
            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    followUser: async (req, res) => {
        const { userIdToFollow } = req.body
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedToken = jwt.verify(token, process.env.REACT_APP_JWT_SECRET);
            const userId = decodedToken._id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const userToFollow = await User.findById(userIdToFollow);
            if (!userToFollow) {
                return res.status(404).json({ message: 'User to follow not found' });
            }
            if (user.following.includes(userIdToFollow)) {
                return res.status(400).json({ message: 'User is already being followed' });
            }
            user.following.push(userIdToFollow);
            userToFollow.followers.push(userId);
            //   await user.save();
            await Promise.all([user.save(), userToFollow.save()]);

            res.json({ message: 'User followed successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

module.exports = userControl