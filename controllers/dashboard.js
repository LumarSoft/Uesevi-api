import dashboardModel from '../models/dashboardModel.js';

const dashboardController = {
  getAll: async (req, res, next) => {
    try {
      const dashboard = await dashboardModel.getAll();
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
};

export default dashboardController;
