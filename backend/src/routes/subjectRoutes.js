import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createSubject, deleteSubject, exportSubjectsCsv, getSubject, listSubjects, updateSubject } from "../controllers/subjectController.js";

const router = Router();
router.get("/", asyncHandler(listSubjects));
router.get("/export/csv", asyncHandler(exportSubjectsCsv));
router.post("/", asyncHandler(createSubject));
router.get("/:id", asyncHandler(getSubject));
router.patch("/:id", asyncHandler(updateSubject));
router.delete("/:id", asyncHandler(deleteSubject));

export default router;
