// utils/dateUtils.js
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (dateString) => {
  return format(new Date(dateString), 'dd/MM/yy HH:mm', { locale: es });
};
