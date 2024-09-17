import inquiriesModel from "../models/inquiriesModel.js";

const inquiriesController = {
  getAllInquiries: async (req, res, next) => {
    try {
      const inquiries = await inquiriesModel.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      next(error);
    }
  },

  addInquiry: async (req, res, next) => {
    try {
      const { name, email, message, phone } = req.body;
      await inquiriesModel.addInquiry(name, email, message, phone);
      res.json({ message: "Inquiry added" });
    } catch (error) {
      next(error);
    }
  },
};

export default inquiriesController;
