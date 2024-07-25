import loginModel from "../models/loginModel.js";

const loginController = {
  getUser: async (req, res, next) => {
    try {
      const { email, password, rol } = req.body;
      const result = await loginModel.getUser(email, password, rol);
      if (result) {
        res.json(result);
      } else {
        res.status(401).json({ message: "Credenciales incorrectas" });
      }
    } catch (error) {
      console.error("Error en el controlador de login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};

export default loginController;