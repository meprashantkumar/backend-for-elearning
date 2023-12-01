import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { instance } from "../server.js";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import sanitize from "mongo-sanitize";

export const register = catchAsyncError(async (req, res, next) => {
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
});

export const login = catchAsyncError(async (req, res, next) => {
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
});

export const myProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    user,
  });
});

export const myCourses = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("subscriptions");

  res.status(200).json({
    user,
  });
});

export const checkout = catchAsyncError(async (req, res) => {
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
});

export const paymentVarification = catchAsyncError(async (req, res, next) => {
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
});
