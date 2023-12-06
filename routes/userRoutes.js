import express from "express";
import {
  checkout,
  getAllUsers,
  login,
  myCourses,
  myProfile,
  paymentVarification,
  register,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").get(isAuthenticated, myProfile);
router.route("/mycourse").get(isAuthenticated, myCourses);
router.route("/verification/:id").post(isAuthenticated, paymentVarification);
router.route("/checkout").post(isAuthenticated, checkout);
router.route("/users").get(isAuthenticated, getAllUsers);

export default router;
