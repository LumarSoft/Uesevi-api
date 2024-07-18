import loginModel from "../models/loginModel.js";

const loginController = {
  getUser: async (req, res, next) => {
    try {
      const { email, password, rol } = req.body;
      const users = await loginModel.getUser(email, password, rol);
      res.json(users);
    } catch (error) {
      next(error);
    }
  },
};

export default loginController;
