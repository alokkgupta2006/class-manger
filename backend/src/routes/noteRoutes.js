import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { deleteNote, listNotes, saveNote } from "../controllers/noteController.js";

const router = Router();
router.get("/", asyncHandler(listNotes));
router.post("/", asyncHandler(saveNote));
router.put("/", asyncHandler(saveNote));
router.delete("/:id", asyncHandler(deleteNote));

export default router;
