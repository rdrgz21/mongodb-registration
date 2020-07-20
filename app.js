const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env'});
const User = require('./models/user');

const app = express();
app.use(express.urlencoded());
app.use(express.json());

// app.use(express.static(path.join(__dirname, '/views/')));

app.use(express.static('public'));
app.use(express.static('public/images'));
// app.use(express.static('public/images'));

const viewsPath = path.join(__dirname, '/views');
app.set('views', viewsPath);
app.set('view engine', 'hbs');

mongoose.connect( process.env.DB_URL ,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB is connected'));

app.get("/", async (req, res) => {
    const allUsers = await User.find();
    console.log(allUsers);
    res.render("index", {
        users: allUsers
    });
})

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const name = req.body.userName;
    const email = req.body.userEmail;
    const password = req.body.userPassword;
    const password2 = req.body.userPassword2;
    const hashedPassword = await bcrypt.hash(password, 8);

    // Add function to check if email already in use
    const otherUser = await User.find({ email: email});
    console.log(otherUser);
    if (otherUser.length > 0) {
        res.render("register", {
            message: "Sorry, that email is already in use"
        });
    } else if (password == password2) {
        await User.create(
            {
                name: name,
                email: email,
                password: hashedPassword
            }
        )
        res.render("register", {
            message: "User successfully registered"
        })
    } else {
        res.render("register", {
            message: "Please ensure both passwords entered match"
        });
    }
})

app.get("/delete/:id", async (req, res) => {
    console.log('Deleting user');
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);

    const allUsers = await User.find();
    res.render("index", {
        users: allUsers,
        message: "User deleted"
    });
});

app.get("/update/:id", async (req, res) => {
    console.log('Accessing update page');
    const userId = req.params.id;
    const user = await User.findById(userId);
    console.log(user);
    res.render("update", {
        userId,
        userName: user.name,
        userEmail: user.email
    });
});

app.post("/update/:id", async (req, res) => {
    console.log('Updating user');

    const newUserName = req.body.newUserName;
    const newUserEmail = req.body.newUserEmail;
    const currentPassword = req.body.currentPassword;
    const newUserPassword = req.body.newUserPassword;
    const newUserPassword2 = req.body.newUserPassword2;
    const hashedPassword = await bcrypt.hash(newUserPassword, 8);

    const userId = req.params.id;
    const user = await User.findById(userId);
    console.log(user.password);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (isMatch && newUserPassword == newUserPassword2) {
        await User.findByIdAndUpdate(userId, {
            name: newUserName,
            email: newUserEmail,
            password: hashedPassword
        });
        res.render("update", {
            userId,
            userName: newUserName,
            userEmail: newUserEmail,
            message: 'User details updated'
        });
    } else if (isMatch && newUserPassword != newUserPassword2) {
        res.render("update", {
            userId,
            userName: user.name,
            userEmail: user.email,
            message: 'Please ensure your new password and reentered passwords match'
        });
    } else if (!isMatch) {
        res.render("update", {
            userId,
            userName: user.name,
            userEmail: user.email,
            message: 'Incorrect password'
        });
    };
});

app.listen(process.env.PORT, () => console.log(`Server started on Port ${process.env.PORT}`));