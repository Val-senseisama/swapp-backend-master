const dotenv = require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const dbConnect = require("./config/dbConnect");
const cookieParser = require("cookie-parser");
const app = express();
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const categoryRouter = require("./routes/productCategoryRoute");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const path = require("path");
const cors = require("cors");

dbConnect();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
//app.use(morgan("dev"));
app.use(cookieParser());

app.use(cors());

app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Headers', '*', 'Access-Control-Allow-Origin', 'Origin', 'X-Requested-with', 'Content_Type,Accept,Authorization','https://th-backend-45458f922f56.herokuapp.com');
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods','PUT,POST,PATCH,DELETE,GET');
        return res.status(200).json({});
    }
    next();
});

app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
