import newsModel from "../models/newsModel.js";

const newsController = {
  getLatest: async (req, res, next) => {
    try {
      const latest = await newsModel.getLatest();
      res.json(latest);
    } catch (error) {
      next(error);
    }
  },
};

export default newsController;
