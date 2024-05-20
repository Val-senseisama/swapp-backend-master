const express = require("express");
const {
  createUser,
  loginUser,
  getAllUser,
  getAUser,
  deleteAUser,
  updatedUser,
  blockUser,
  unBlockUser,
  updatePassword,
  handleRefreshToken,
  logOut,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  saveAddress,
  //   getWishlist,
  //   userCart,
  //   getUserCart,
  //   emptyCart,
  //   applyCoupon,
  //   createOrder,
  //   getOrders,
  //   updateOrderStatus,
} = require("../controllers/userCtrl");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", createUser);
router.post("/admin-login", loginUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);
router.post("/admin-login", loginAdmin);
router.get("/all-users", getAllUser);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logOut);
router.get("/:id", authMiddleware, isAdmin, getAUser);
router.delete("/:id", deleteAUser);
router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unBlockUser);

module.exports = router;
