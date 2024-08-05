// utils/dateUtils.js
import { format } from "date-fns";
import { es } from "date-fns/locale";
import cheerio from "cheerio";

export const formatDate = (dateString) => {
  return format(new Date(dateString), "dd/MM/yy HH:mm", { locale: es });
};

export const formatedHTML = (content) => {
  const $ = cheerio.load(content);

  const textoLimpio = $.text();

  return textoLimpio.trim();
};
