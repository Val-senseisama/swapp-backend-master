const User = require("../models/userModel");
const Product = require("../models/productModel");
//const Cart = require("../models/cartModel");
//const Coupon = require("../models/couponModel");
//const Order = require("../models/orderModel");
//const uniqid = require("uniqid");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwt");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { generateRefreshToken } = require("../config/refreshToken");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailController");
const crypto = require("crypto");

// CREATE USER
const createUser = asyncHandler(async(req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({email: email});

    if(!findUser) {
        //create new user
        const newUser = await User.create(req.body);
        res.json(newUser);
    }else{
        throw new Error("User already exists")
    }
});


// LOGIN USER
const loginUser = asyncHandler(async(req, res) => {
    const { email, password} = req.body;

    // check if user exists
    const findUser = await User.findOne({email: email});
    if( findUser && await findUser.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshToken(findUser?._id);
      const updateUser = await User.findOneAndUpdate(findUser.id, {
         refreshToken: refreshToken
      }, 
      { new: true });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72*60*60*1000
      })
        res.json({
        _id: findUser?._id,
       firstname: findUser?.firstname,
       lastname: findUser?.lastname,
       email: findUser?.email,
       mobile:findUser?.mobile,
       token: generateToken(findUser?._id)
      });
      } else {
        throw new Error("Invalid Credentials");
    }
});

//Admin Login

const loginAdmin = asyncHandler(async(req, res) => {
    const { email, password} = req.body;

    // check if user exists
    const findAdmin = await User.findOne({email: email});
    if(findAdmin.role !== "admin") throw new Error("Not Authorised");
    if( findAdmin && await findAdmin.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshToken(findAdmin?._id);
      const updateUser = await User.findOneAndUpdate(findAdmin.id, {
         refreshToken: refreshToken
      }, 
      { new: true });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72*60*60*1000
      })
        res.json({
        _id: findAdmin?._id,
       firstname: findAdmin?.firstname,
       lastname: findAdmin?.lastname,
       email: findAdmin?.email,
       mobile:findAdmin?.mobile,
       token: generateToken(findAdmin?._id)
      });
      } else {
        throw new Error("Invalid Credentials");
    }
});


// Handle refresh token
const handleRefreshToken = asyncHandler(async(req, res) => {
    const cookie = req.cookies;

    if(!cookie?.refreshToken) throw new Error("No refresh token in cookies");
    const refreshToken = cookie.refreshToken;

    const user = await User.findOne({ refreshToken });
    if(!user) throw new Error("No refresh token present in db or not matched");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if( err || user.id !== decoded.id) {
            throw new Error("There is something wrong with the refresh token");
        }else{
            const accessToken = generateToken(user?._id);
            res.json({ accessToken });
        }
    });
});


//logout user

const logOut = asyncHandler(async(req, res) => {
    const cookie = req.cookies;
    if(!cookie?.refreshToken) throw new Error("No refresh token in cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if(!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true
        });
        return res.sendStatus(204) // forbidden
    }
    await User.findOneAndUpdate(refreshToken, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true
    });
    return res.sendStatus(204) // forbidden
});



// update a user
const updatedUser = asyncHandler(async (req, res) => {
   const { _id } = req.user;
   validateMongoDbId(_id);
   try {
    const updatedUser = await User.findByIdAndUpdate(_id, {
        firstname: req.body?.firstname,
        lastname: req.body?.lastname,
        email: req.body?.email,
        mobile: req.body?.mobile
    },
    {
        new: true,
    });
    res.json(updatedUser)
   } catch (error) {
     throw new Error(error)
   }
});

// Save User's Address

const saveAddress = asyncHandler(async(  req, res, next ) =>{
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
     const updatedUser = await User.findByIdAndUpdate(_id, {
         address: req.body?.address,
     },
     {
         new: true,
     });
     res.json(updatedUser)
    } catch (error) {
      throw new Error(error)
    }
});



// get all users

const getAllUser = asyncHandler(async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
    } catch (error) {
        throw new Error(error);
    }
});

// get a single user

const getAUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
   try {
     const getAUser = await User.findById( id );
     res.json({getAUser})
   } catch (error) {
    throw new Error(error)
   }
});

// delete a single user

const deleteAUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
   try {
     const deleteAUser = await User.findByIdAndDelete( id );
     res.json({deleteAUser})
   } catch (error) {
    throw new Error(error)
   }
});


//block user

const blockUser = asyncHandler(async(req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);

    try {
        const block = await User.findByIdAndUpdate(id, 
            {
                isBlocked: true
            },
            {
                new: true
            }
        );
        res.json({
            message: "user blocked"
        });
    } catch (error) {
        throw new Error(error)
    }
});

// unblock user

const unBlockUser = asyncHandler(async(req, res) => {

    const { id } = req.params;
    validateMongoDbId(id);

    try {
        const unBloclock = await User.findByIdAndUpdate(id, 
            {
                isBlocked: false
            },
            {
                new: true
            }
        );

        res.json({
            message: "user unblocked"
        });
    } catch (error) {
        throw new Error(error)
    }
});

const updatePassword = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    const{ password }= req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
    if(password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword)
    } else{
        res.json(user);
    }
});


const forgotPasswordToken = asyncHandler(async(req, res) => {
 const { email } = req.body;
 const user = await User.findOne({ email });
 if(!email) throw new Error("User not found with this email");

 try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, Please click on this link to reset your password. Be quick though because this link will expire in 10 minutes. <a href="http://localhost:5000/api/user/reset-password/${token}">Click Here</a>`

    const data = {
        to: email,
        text: "Hey User",
        subject: "Password Reset Link",
        htm: resetURL
    };
    sendEmail(data);
    res.json(token);
 } catch (error) {
    throw new Error(error);
 }
});

const resetPassword =asyncHandler(async(req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now()}
    });
    if(!user) throw new Error("Token expired please try again later");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getWishlist = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const findUser = await User.findById(_id).populate("wishlist");
        res.json(findUser);

    } catch (error) {
        throw new Error(error)
    }
});

const userCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let products = [];
    const user = await User.findById(_id);
    // check if user already has products in cart
    const alreadyExistsCart = await Cart.findOne({ orderedBy: user._id });
    if(alreadyExistsCart){
        alreadyExistsCart.remove()
    }
    for (let i = 0; i < cart.length; i++) {
       let object = {};
       object.product = cart[i].id;
       object.count = cart[i].count;
       object.color = cart[i].color;
       let getPrice = await Product.findById(cart[i].id).select("price").exec();
       object.price = getPrice.price;
       products.push(object);
    }  
    let cartTotal = 0;
    for ( let i = 0; i < products.length; i++ ){
        cartTotal = cartTotal + products[i].price * products[i].count;
    }
    let newCart = await new Cart({
        products,
        cartTotal,
        orderedBy: user?._id
    }).save();
    res.json(newCart);

  } catch (error) {
    throw new Error(error);
  }

});

const getUserCart = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    validateMongoDbId( _id );
    try {
        const cart = await Cart.findOne({ orderedBy: _id }).populate( 'products.product', "_id title price totalAfterDiscount" );
        res.json(cart);
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
});


const emptyCart = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    validateMongoDbId( _id );
    try {
        const user = await User.findOne({ _id });
        const cart = await Cart.findOneAndRemove({ orderedBy: user._id });
        res.json(cart);
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }
});

const applyCoupon = asyncHandler(async(req, res) => {
    const { coupon } = req.body;
    const { _id } = req.user;
    validateMongoDbId( _id );
    const validCoupon = await Coupon.findOne({name: coupon})
    if( validCoupon === null ) throw new Error("Invalid Coupon");
    const user = await User.findOne({_id});
    let { products,cartTotal } = await Cart.findOne({ orderedBy : user._id}).populate("products.product");
    let totalAfterDiscount =  (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2);
    await Cart.findOneAndUpdate({ orderedBy: user._id }, {totalAfterDiscount}, {new: true});
    res.json(totalAfterDiscount);
});


const createOrder = asyncHandler(async(req, res) => {
    const { COD, couponApplied } = req.body;
    const { _id } = req.user;
    validateMongoDbId( _id );
    try {
        if(!COD) throw new Error("Create cash order failed");
        const user = await User.findById(_id);
        let userCart = await Cart.findOne({orderedBy: user._id});
        let finalAmount = 0;
        if( couponApplied && userCart.totalAfterDiscount ){
            finalAmount = userCart.totalAfterDiscount;
        } else {
            finalAmount = userCart.cartTotal;
        }
        let newOrder = await new Order({
            products: userCart.products,
            paymentIntent:{
                id: uniqid(),
                method:"COD",
                amount: finalAmount,
                status: "Cash on delivery",
                created: Date.now(),
                currency:"usd",
            },
            orderedBy: user._id,
            orderStatus: "Cash on delivery"
        }).save();
        let update = userCart.products.map((item) => {
            return{
                updateOne: {
                    filter: { _id: item.product._id },
                    update: {$inc: { quantity: -item.count, sold: +item.count }},
                }
            };
        });
        const updated = await Product.bulkWrite(update, {});
        res.json({message:"success"})
    } catch (error) {
        throw new Error(error)
    }
});

const getOrders = asyncHandler(async(req, res) => {
    const { _id } = req.user;
    validateMongoDbId( _id );
    try {
        const userOrders = await Order.find({ orderedBy: _id}).populate("products.product").exec();
        res.json(userOrders);
    } catch (error) {
        throw new Error(error)
    }
});

const updateOrderStatus = asyncHandler(async(req, res) => {
 const { status } = req.body;
 const { id } = req.params;
 validateMongoDbId(id);
 try {
    const updatedOrderStatus = await Order.findByIdAndUpdate(
        id,
        {
            orderStatus: status,
            paymentIntent: {
                status: status
            }
        },
        {new: true});
        res.json(updatedOrderStatus);
 } catch (error) {
    throw new Error(error)
 }
});



module.exports={ createUser, loginUser, getAllUser, getAUser, deleteAUser, updatedUser, blockUser, unBlockUser, updatePassword, handleRefreshToken, logOut, forgotPasswordToken, resetPassword, loginAdmin,getWishlist, saveAddress, userCart, getUserCart, emptyCart, applyCoupon, createOrder, getOrders, updateOrderStatus };
