import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { instance } from "../server.js";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import sanitize from "mongo-sanitize";

export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password)
      return res.status(400).json({
        message: "Please Enter All Details",
      });

    let user = await User.findOne({ email });

    if (user)
      return res.status(409).json({
        message: "User Already Exist",
      });

    user = await User.create({
      firstname,
      lastname,
      email,
      password,
    });

    const token = user.getJWTToken();

    res.status(201).json({
      message: "User Registered",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = sanitize(req.body);

    if (!email || !password)
      return res.status(400).json({
        message: "Please Enter All Details",
      });

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(401).json({
        message: "Incorrect Email or Password",
      });

    const isMatch = await user.comparePassword(password);

    if (!isMatch)
      return res.status(401).json({
        message: "Incorrect Email or Password",
      });

    const token = user.getJWTToken();

    res.status(201).json({
      message: `Welcome Back ${user.firstname}`,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const myCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const id = await user.subscriptions;

    const usercourses = await Course.find({
      _id: id,
    });

    res.status(200).json({
      usercourses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const checkout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { id } = req.body;

    const course = await Course.findById(id);

    if (user.subscriptions.includes(course._id)) {
      return res.status(403).json({
        message: "You Already Have this Course",
      });
    }

    const options = {
      amount: Number(course.price * 100),
      currency: "INR",
    };

    const order = await instance.orders.create(options);

    res.status(201).json({
      order,
      course,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const paymentVarification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body)
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      const user = await User.findById(req.user._id);

      const course = await Course.findById(req.params.id);

      await user.subscriptions.push(course._id);

      await user.save();

      res.status(200).json({
        message: "Course Purchased Successfully",
      });
    } else {
      return res.status(400).json({ message: "Payment Failed" });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({
        message: "You are not admin",
      });

    const users = await User.find();

    res.status(200).json({
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
