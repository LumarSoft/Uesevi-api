-- Índices recomendados para optimizar la búsqueda de empleados
-- Ejecutar estos comandos en la base de datos para mejorar significativamente el rendimiento

-- Índices para la tabla usuarios
CREATE INDEX idx_usuarios_rol_deleted ON usuarios(rol, deleted);
CREATE INDEX idx_usuarios_apellido ON usuarios(apellido);
CREATE INDEX idx_usuarios_nombre ON usuarios(nombre);
CREATE INDEX idx_usuarios_apellido_nombre ON usuarios(apellido, nombre);

-- Índices para la tabla empleados  
CREATE INDEX idx_empleados_cuil ON empleados(cuil);
CREATE INDEX idx_empleados_usuario_id ON empleados(usuario_id);

-- Índices para la tabla contratos
CREATE INDEX idx_contratos_empleado_estado_deleted ON contratos(empleado_id, estado, deleted);
CREATE INDEX idx_contratos_empresa_estado_deleted ON contratos(empresa_id, estado, deleted);

-- Índices para la tabla empresas
CREATE INDEX idx_empresas_nombre ON empresas(nombre);

-- Índice compuesto para la consulta principal
CREATE INDEX idx_search_optimization ON usuarios(rol, deleted, apellido, nombre);

-- Verificar índices existentes
SHOW INDEX FROM usuarios;
SHOW INDEX FROM empleados;
SHOW INDEX FROM contratos;
SHOW INDEX FROM empresas;
