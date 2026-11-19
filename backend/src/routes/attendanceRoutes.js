import { Router } from "express";
import { addAttendance, deleteAttendance, updateAttendance } from "../controllers/attendanceController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.post("/subjects/:id/attendance", asyncHandler(addAttendance));
router.patch("/attendance/:entryId", asyncHandler(updateAttendance));
router.delete("/attendance/:entryId", asyncHandler(deleteAttendance));

export default router;
