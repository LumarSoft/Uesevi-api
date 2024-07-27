import loginModel from "../models/loginModel.js";

const loginController = {
  getUser: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await loginModel.getUser(email, password);
      if (result.error) {
        return res.status(401).json({ message: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error en el controlador de login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};

export default loginController;
