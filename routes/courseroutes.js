import express from "express";
import { authorizeTeacher, isAuthenticated } from "../middlewares/auth.js";
import {
  addLecture,
  createCourse,
  deleteCourse,
  deleteCourseByAdmin,
  deleteLecture,
  getAllCourses,
  getAllCoursesAdmin,
  getCourseLectures,
  getSingleCourse1,
} from "../controllers/courseControllers.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

router.route("/courses").get(getAllCourses);
router
  .route("/courses/admin")
  .get(isAuthenticated, authorizeTeacher, getAllCoursesAdmin);
router.route("/course/:id").get(isAuthenticated, getSingleCourse1);
router.route("/course/lectures/:id").get(isAuthenticated, getCourseLectures);
router
  .route("/course/lectures/add/:id")
  .post(isAuthenticated, authorizeTeacher, singleUpload, addLecture);

router
  .route("/new/course")
  .post(isAuthenticated, authorizeTeacher, singleUpload, createCourse);

router
  .route("/course/delete/:id")
  .delete(isAuthenticated, authorizeTeacher, deleteCourse);

router
  .route("/course/delete/admin/:id")
  .delete(isAuthenticated, deleteCourseByAdmin);

router
  .route("/course/lecture")
  .delete(isAuthenticated, authorizeTeacher, deleteLecture);

export default router;
