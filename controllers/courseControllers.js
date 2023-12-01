import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import { User } from "../models/User.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";

export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  })
    .select("-lectures")
    .select("-notes")
    .select("-dpps");

  res.status(200).json({
    courses,
  });
});

export const getAllCoursesAdmin = catchAsyncError(async (req, res, next) => {
  const courses = await Course.find({
    ownerId: req.user._id,
  });

  res.status(200).json({
    courses,
  });
});

export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy, duration, price } = req.body;

  if (!title || !description || !category || !createdBy || !duration || !price)
    return res.status(400).json({
      message: "Please add all fields",
    });

  const file = req.file;

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    createdBy,
    poster: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
    ownerId: req.user._id,
    duration,
    price,
  });

  res.status(201).json({
    message: "Course Created Successfully. You can add lectures now.",
  });
});

export const getSingleCourse1 = catchAsyncError(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .select("-lectures")
    .select("-notes")
    .select("-dpps");

  res.status(200).json({
    course,
  });
});

export const getCourseLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  const user = await User.findOne(req.user._id);
  if (user._id.toString() === course.ownerId) {
    return res.status(200).json({
      lectures: course.lectures,
    });
  }

  if (!user.subscriptions.includes(course._id))
    return res.status(403).json({
      message: "You Have not subscribed to this course",
    });

  course.views += 1;

  await course.save();

  res.status(200).json({
    lectures: course.lectures,
  });
});

// Max video size 100mb
export const addLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const course = await Course.findById(id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    const file = req.file;
    const fileUri = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content, {
      resource_type: "video",
    });

    course.lectures.push({
      title,
      description,
      video: {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      },
    });

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).json({
      message: "Lecture added in Course",
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course)
      return res.status(404).json({
        message: "No Course Found",
      });

    if (course.ownerId !== req.user._id.toString()) {
      return res.status(401).json({
        message: "This Course Is Not Created By You",
      });
    }

    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    for (let i = 0; i < course.lectures.length; i++) {
      const singleLecture = course.lectures[i];
      await cloudinary.v2.uploader.destroy(singleLecture.video.public_id, {
        resource_type: "video",
      });
    }

    await course.deleteOne();

    res.status(200).json({
      message: "Course Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { courseId, lectureId } = req.query;

  const course = await Course.findById(courseId);

  if (!course)
    return res.status(404).json({
      message: "No Course Found",
    });

  if (course.ownerId !== req.user._id.toString()) {
    return res.status(401).json({
      message: "This Course Is Not Created By You",
    });
  }

  const lecture = course.lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) return item;
  });
  await cloudinary.v2.uploader.destroy(lecture.video.public_id, {
    resource_type: "video",
  });

  course.lectures = course.lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) return item;
  });

  course.numOfVideos = course.lectures.length;

  await course.save();

  res.status(200).json({
    message: "Lecture Deleted Successfully",
  });
});
