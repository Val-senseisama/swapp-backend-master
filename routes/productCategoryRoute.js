const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getAllCategory,
} = require("../controllers/productCategoryController");
const { isAdmin, authMiddleware } = require("../middleware/authMiddleware");

express = require("express");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createCategory);
router.put("/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
router.get("/:id", getCategory);
router.get("/", getAllCategory);

module.exports = router;
