import bcrypt from 'bcrypt';

const plainPassword = 'Zuviria5975';
let hashedPassword = '$2y$10$w89xekIgcfdhrwzE.KsBFuvuX5o.N4NWZmFynt8JcqePRNNF61lZG';

// Convertir el hash almacenado si es necesario
if (hashedPassword.startsWith('$2y$')) {
  hashedPassword = hashedPassword.replace('$2y$', '$2b$');
}

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error('Error al comparar contraseñas:', err);
  } else {
    console.log('¿Las contraseñas coinciden?', result);
  }
});
