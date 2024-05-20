const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const User = require("../models/userModel");
const validateMongoDbId = require("../utils/validateMongoDbId");
const cloudinaryUploadImg = require("../utils/cloudinary");
const fs = require("fs");

const createProduct = asyncHandler(async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const id = req.params;
  const owner = await Product.findById(id).owner;
  if (owner === req.user._id || req.user.role === "Admin") {
    try {
      const updateProduct = await Product.findOneAndUpdate({ id }, req.body, {
        new: true,
      });

      res.json(updateProduct);
    } catch (error) {
      throw new Error(error);
    }
  } else {
    res.statusCode(400).send("Back off");
  }
});

const deleteAProduct = asyncHandler(async (req, res) => {
  const id = req.params;
  try {
    const deleteAProduct = await Product.findOneAndDelete(id);

    res.json(deleteAProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const findProduct = await Product.findById(id);
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  try {
    //filtering

    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObject[el]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Limiting the fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    //Pagination

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This page does not exist");
    }
    console.log(page, limit, skip);

    const product = await query;
    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});

// const addToWishlist = asyncHandler(async(req, res) => {
//     const { _id } = req.user;
//     const {prodId} = req.body;
//     try {
//         const user =await User.findById(_id);
//         const alreadyAdded =  user.wishlist.find((id)=>id.toString() === prodId);
//         if(alreadyAdded){
//             let user = await User.findByIdAndUpdate(_id, {
//                 $pull: { wishlist: prodId }
//             }, {new: true});
//             res.json(user);
//         } else {
//             let user = await User.findByIdAndUpdate(_id, {
//                 $push: { wishlist: prodId }
//             }, {new: true});
//             res.json(user);
//         }
//     } catch (error) {
//         throw new Error(error);
//     }
// });

// const rating = asyncHandler(async(req, res) => {
//     const { _id } = req.user;
//     const { star, prodId, comment } = req.body;
//     const product = await Product.findById(prodId);
//     let alreadyRated = product.ratings.find((userId)=> userId.postedBy.toString() === _id.toString());
//     try {

//     if(alreadyRated){
//         const updateRating = await Product.updateOne({
//             ratings: {$elemMatch: alreadyRated}
//         },{
//             $set: {"ratings.$.star": star, "ratings.$.comment": comment}
//         }, {new: true});
//     }else{
//         const rateProduct = await Product.findByIdAndUpdate(prodId, {
//             $push: {
//                 ratings: {
//                     star: star,
//                     comment: comment,
//                     postedBy: _id
//                 },
//             },
//         },{new: true});
//     } const getAllRatings = await Product.findById(prodId);
//     let totalRating = getAllRatings.ratings.length;
//     let ratingSum = getAllRatings.ratings.map((item) => item.star).reduce((prev, curr) => prev + curr, 0);
//     let actualRating = Math.round( ratingSum / totalRating);
//    let finalProduct = await Product.findByIdAndUpdate(prodId, {
//         totalRatings: actualRating
//     }, {new: true});
//     res.json(finalProduct);
//     } catch (error) {
//         throw new Error(error)
//     }
// });

const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const uploader = (path) => cloudinaryUploadImg(path, "images");
    const urls = [];
    let files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await uploader(path);
      urls.push(newPath);
      fs.unlinkSync(path);
    }
    const findProduct = await Product.findByIdAndUpdate(
      id,
      {
        images: urls.map((file) => {
          return file;
        }),
      },
      { new: true }
    );
    res.json(findProduct);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createProduct,
  getAProduct,
  getAllProducts,
  updateProduct,
  deleteAProduct,
  //   addToWishlist,
  //   rating,
  uploadImages,
};
