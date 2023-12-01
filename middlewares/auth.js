import jwt from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import { User } from "../models/User.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.headers;

  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded._id);
  }

  next();
});

// export const authorizeSubscribers = (req, res, next) => {
//   if (req.user.subscription.status !== "active" && req.user.role !== "admin")
//     return next(
//       new ErrorHandler(`Only Subscribers can acces this resource`, 403)
//     );

//   next();
// };

export const authorizeTeacher = (req, res, next) => {
  if (req.user.role !== "teacher")
    return res.status(403).json({
      message: `${req.user.role} is not allowed to access this resource`,
    });

  next();
};
