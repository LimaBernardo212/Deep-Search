//API = Application Programming Interface
//REST = Representational State Transfer
//CRUD = Create, Read, Update, Delete
//GET, POST, PUT/ PATCH, DELETE
//JSON =  Javascript Object Notation
import express from "express";
const app = express();
const PORT = 3000;
const objResp = {
    name: "Black",
    company : "Colors"
}
app.get('/', (req, res) => {
    res.json(objResp)
} )
app.listen(PORT, () => {
    console.log(`Hello Server! You as running at ${PORT}° of my Home`)
})
