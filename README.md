# PRIMERO QUE NADA HACER .ENV

Para crear un nuevo endpoint

# Paso 1:

    Revisar si se trata de una nueva modelo de datos. Por ej: noticias es distinto a declaraciones juradas.

    Dependiendo de eso crear o no un archivo en la carpeta Routes

    Una vez ubicado en el archivo.

    Hacer la ruta, citar al controlador y al metodo de ese controlador

    EJ: router.post("/add-noticia", noticiasController.addNoticia);

# Paso 2:

    Crear el metodo del controlador

    Ej:

        addNoticia: async (req, res, next) => {
            try {
                const { titulo, contenido } = req.body;
                const result = await noticiasModel.addNoticia(titulo, contenido);
                res.json(result);
            } catch (error) {
                next(error);
            }
        },

    Importante mantener estrucutra similar

# Paso 3: 
    Crear la funcion que va a ejecutar el modelo

        addNoticia: async (req, res, next) => {
            try {
                const { titulo, contenido } = req.body;
                const result = await noticiasModel.addNoticia(titulo, contenido);
                res.json(result);
            } catch (error) {
                next(error);
            }
        },
