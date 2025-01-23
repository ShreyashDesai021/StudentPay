const express=require("express");
const app = express();

console.dir(app);

let port =3000;

app.listen(port,()=>{
    console.log(`app is listening on port ${port}`);
});

app.get("/",(req,res)=>{
    res.send("Hello, I am root");
})

app.get("/apple",(req,res)=>{
    res.send("you contacted apple path");
})


// app.use((req,res)=>{
//     console.log("request received");
//     var code = "<h1>Fruits</h1><ul><li>Apple</li></ul>";
//     res.send(code);
// });