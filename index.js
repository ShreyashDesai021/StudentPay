const express = require("express");
const app =express();
const path = require("path");
const mysql = require("mysql2");
const { urlencoded } = require("body-parser");

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
        let seependingorders = `SELECT * FROM pendingorders ORDER BY OrderID`;
        let seeorderhistory = `SELECT * FROM orderhistory ORDER BY OrderID`;
        connection.query(seependingorders, (err, result_pending_orders) => {
            if (err) {
                console.error("Error fetching pending orders:", err);
                return res.status(500).send("Error fetching pending orders");
            }
            connection.query(seeorderhistory, (err, result_orders_history) => {
                if (err) {
                    console.error("Error fetching order history:", err);
                    return res.status(500).send("Error fetching order history");
                }
                res.render("shopkeeper_home", {
                    shopkeeper: shopkeeper,
                    pendingorders: result_pending_orders || [],
                    ordershistory: result_orders_history || []
                });
            });
        });
    });
});

//student
app.get("/student_login",(req,res)=>{
    res.render("student_login");
});

app.post("/student_login",(req,res)=>{
    const {username,password} = req.body;
    let q=`SELECT * FROM student WHERE username = ?`;
    connection.query(q,[username] , (err, result)=>{
        if (err) throw err;
        if (result.length > 0) {
            const student = result[0];
            if(password == student.password){
                res.render("student_home",{student});
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

app.get("/student_home",(req,res)=>{
    res.render("student_home");
});

app.listen('3000',(req,res)=>{
    console.log("Server is running");
});