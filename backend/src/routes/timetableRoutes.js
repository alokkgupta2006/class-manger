import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createTimetableEntry,
  deleteTimetableEntry,
  listTimetable,
  updateTimetableEntry
} from "../controllers/timetableController.js";

const router = Router();
router.get("/", asyncHandler(listTimetable));
router.post("/", asyncHandler(createTimetableEntry));
router.patch("/:id", asyncHandler(updateTimetableEntry));
router.delete("/:id", asyncHandler(deleteTimetableEntry));

export default router;
