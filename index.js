const express = require("express");
const app =express();
const path = require("path");
const mysql = require("mysql2");


app.use(express.urlencoded({extended:true}));
app.set("view engine", "ejs")
app.set("views",path.join(__dirname,"/views"));

const connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    database : 'studentpay',
    password : 'pass123'
});

app.get("/",(req,res)=>{
    res.render("category");
});

//shopkeeper
app.get("/shopkeeper_login",(req,res)=>{
    res.render("shopkeeper_login");
});

app.post("/shopkeeper_login", (req, res) => {
    const { username, password } = req.body;
    let q = `SELECT * FROM shopkeeper WHERE username = ?`;

    connection.query(q, [username], (err, result) => {
        if (err) {
            console.error("Error fetching shopkeeper:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
            console.log("Shopkeeper not found");
            return res.render("shopkeeper_login");
        }

        const shopkeeper = result[0];

        if (password !== shopkeeper.password) {
            console.log("Incorrect password");
            return res.render("shopkeeper_login");
        }
        res.redirect(`/shopkeeper_home/${shopkeeper.shopkeeperid}`);
    });
});

app.get("/shopkeeper_home/:id",(req,res)=>{
    const {id} = req.params;
    let q = `SELECT * FROM shopkeeper WHERE shopkeeperid = ?`;
    let seependingorders = `SELECT * FROM pendingorders ORDER BY OrderID`;
    let seeorderhistory = `SELECT * FROM orderhistory ORDER BY OrderID`;
    connection.query(q,[id],(err,result_shopkeeper)=>{
        let shopkeeper = result_shopkeeper[0];
        connection.query(seependingorders, (err, result_pending_orders) => {
            if (err) throw err;
            connection.query(seeorderhistory, (err, result_orders_history) => {
                if (err) throw err;
                res.render("shopkeeper_home", {
                    shopkeeper: shopkeeper,
                    pendingorders: result_pending_orders || [],
                    ordershistory: result_orders_history || []
                });
            });
        });
    });
});
    

//mark as printed

app.post("/shopkeeper_home/:id/mark/:orderid",(req,res)=>{
    const {id, orderid}= req.params;
    let q1= `call MoveOrderToHistory(?)`;   
    connection.query(q1,[orderid],(err,result_moved)=>{
        res.redirect(`/shopkeeper_home/${id}`);
    })
})

//student
app.get("/student_login",(req,res)=>{
    res.render("student_login");
});

app.post("/student_login",(req,res)=>{
    const {prn,password} = req.body;
    let q=`SELECT * FROM student WHERE prn = ?`;
    connection.query(q,[prn], (err, result)=>{
        if (err) throw err;
        if (result.length > 0) {
            const student = result[0];
            if(password == student.password){
                res.redirect(`/student_home/${student.prn}`);
            }
            else{
                console.log("wrong pwd");
                res.render("student_login");
            }
        } else {
            res.render("student_login");
        }
    })
});

app.get("/student_home/:prn", (req, res) => {
    const { prn } = req.params;
    let qStudent = `SELECT * FROM student WHERE prn = ?`;
    let qPending = `SELECT * FROM pendingorders WHERE student_name = ?`;
    let qHistory = `SELECT * FROM orderhistory WHERE student_name = ?`;

    connection.query(qStudent, [prn], (err, resultStudent) => {
        if (err) {
            console.error("Error fetching student:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (resultStudent.length === 0) {
            return res.status(404).send("Student not found");
        }

        const student = resultStudent[0];

        connection.query(qPending, [student.student_name], (err, pendingOrders) => {
            if (err) throw err;

            connection.query(qHistory, [student.student_name], (err, orderHistory) => {
                if (err) throw err;

                res.render("student_home", {
                    student,
                    pendingorders : pendingOrders || [],
                    orderhistory: orderHistory || []
                });
            });
        });
    });
});


const multer = require("multer");

// Storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/upload/:prn", upload.single('file'), (req, res) => {
    const { prn } = req.params;
    const { filename, type, copies, side } = req.body;
    const fileData = req.file.filename;

    const price = type === "color" ? 5 * parseInt(copies) : 1 * parseInt(copies);

    let qStudent = `SELECT student_name FROM student WHERE prn = ?`;
    connection.query(qStudent, [prn], (err, result) => {
        if (err || result.length === 0) return res.status(500).send("Student error");

        const student_name = result[0].student_name;

        const qInsert = `INSERT INTO pendingorders (student_name, filename, file_data, type, copies, side, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`;

        connection.query(qInsert, [student_name, filename, fileData, type, copies, side, price], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Upload failed");
            }
            res.redirect(`/student_home/${prn}`);
        });
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post("/shopkeeper_home/:id/mark/:orderid", (req, res) => {
    const { id, orderid } = req.params;

    const qMove = `CALL MoveOrderToHistory(?)`; // Assuming you have this procedure in MySQL

    connection.query(qMove, [orderid], (err, result) => {
        if (err) {
            console.error("Error moving to history:", err);
            return res.status(500).send("Error marking order");
        }
        res.redirect(`/shopkeeper_home/${id}`);
    });
});


app.get("/student_home",(req,res)=>{
    res.render("student_home");
});

app.listen('3000',(req,res)=>{
    console.log("Server is running");
});