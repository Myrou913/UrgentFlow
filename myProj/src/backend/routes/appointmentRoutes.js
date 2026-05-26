/* global require, module */
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

router.post("/", appointmentController.createAppointment);
router.get("/user/:userId/records", appointmentController.getPatientRecords);
router.get("/user/:userId/settings", appointmentController.getUserSettings);
router.put("/user/:userId/settings", appointmentController.saveUserSettings);
router.get(
  "/user/:userId/notifications",
  appointmentController.getUserNotifications,
);
router.post("/user/:userId/manual", appointmentController.createManualAppointment);
router.get("/admin/dashboard", appointmentController.getAdminDashboard);
router.get("/admin/archives", appointmentController.getAdminArchives);
router.put(
  "/admin/appointments/:appointmentId",
  appointmentController.updateAppointmentStatus,
);
router.post(
  "/admin/appointments/:appointmentId/follow-up",
  appointmentController.scheduleFollowUpAppointment,
);
router.post("/emergency", appointmentController.createEmergencyRequest);
router.put("/emergency/:requestId/done", appointmentController.resolveEmergencyRequest);

module.exports = router;
