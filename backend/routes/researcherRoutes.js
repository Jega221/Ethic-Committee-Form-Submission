import express from "express";
import { getResearchers, createResearcher } from "../controllers/researcherController.js";

const router = express.Router();

router.get("/", getResearchers);
router.post("/", createResearcher);

export default router;
        