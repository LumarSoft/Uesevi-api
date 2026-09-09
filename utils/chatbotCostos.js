// ---------------------------------------------------------------------------
// Precios y cálculo de costo de cada consulta a Nacho.
//
// El modelo se cobra por token, con tres tarifas distintas: entrada, entrada
// que salió del caché de OpenAI (mucho más barata) y salida. Los tokens de
// razonamiento ya vienen incluidos en los de salida: se guardan aparte sólo
// para entender a dónde se va la plata.
//
// Las tarifas viven en variables de entorno y se expresan en USD por millón de
// tokens, igual que la página de precios de OpenAI. Se leen en cada cálculo (no
// se cachean) para poder corregirlas sin reiniciar el proceso.
//
//   OPENAI_PRECIO_ENTRADA=...        USD por 1M de tokens de entrada
//   OPENAI_PRECIO_ENTRADA_CACHEADA=  USD por 1M de tokens de entrada cacheados
//   OPENAI_PRECIO_SALIDA=...         USD por 1M de tokens de salida
//
// Si no están configuradas, el costo se guarda en 0 pero los tokens se siguen
// midiendo: el costo se puede recalcular después con las tarifas correctas.
// ---------------------------------------------------------------------------

const POR_MILLON = 1_000_000;

const aNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
};

export const precios = () => ({
  entrada: aNumero(process.env.OPENAI_PRECIO_ENTRADA),
  entradaCacheada: aNumero(process.env.OPENAI_PRECIO_ENTRADA_CACHEADA),
  salida: aNumero(process.env.OPENAI_PRECIO_SALIDA),
});

// Sin tarifas configuradas todo costo da 0: hay que avisarlo en el reporte para
// que nadie lea "gastamos USD 0" como un dato bueno.
export const preciosConfigurados = () => {
  const { entrada, salida } = precios();
  return entrada > 0 && salida > 0;
};

/**
 * Costo en USD de un consumo de tokens. `cacheados` es un subconjunto de
 * `entrada`: se descuenta y se cobra a la tarifa de caché.
 */
export const calcularCosto = ({ entrada = 0, cacheados = 0, salida = 0 }) => {
  const tarifas = precios();
  const sinCache = Math.max(0, entrada - cacheados);
  const costo =
    (sinCache * tarifas.entrada +
      cacheados * tarifas.entradaCacheada +
      salida * tarifas.salida) /
    POR_MILLON;
  // 6 decimales: una consulta barata puede costar fracciones de centavo.
  return Math.round(costo * 1e6) / 1e6;
};

// Acumulador de una consulta: el loop de herramientas llama al modelo varias
// veces y cada vuelta trae su propio `usage`.
export const nuevaMedicion = () => ({
  vueltas: 0,
  llamadas_modelo: 0,
  tokens_entrada: 0,
  tokens_cacheados: 0,
  tokens_salida: 0,
  tokens_razonamiento: 0,
});

/**
 * Suma a la medición el `usage` de una respuesta de la Responses API. Tolera
 * que falte: si el stream se corta a mitad de una vuelta, esa vuelta no
 * reporta uso y se pierde (es la única parte que no podemos medir).
 */
export const sumarUso = (medicion, usage) => {
  if (!usage) return medicion;
  medicion.llamadas_modelo += 1;
  medicion.tokens_entrada += aNumero(usage.input_tokens);
  medicion.tokens_cacheados += aNumero(usage.input_tokens_details?.cached_tokens);
  medicion.tokens_salida += aNumero(usage.output_tokens);
  medicion.tokens_razonamiento += aNumero(usage.output_tokens_details?.reasoning_tokens);
  return medicion;
};

export const costoDeMedicion = (medicion) =>
  calcularCosto({
    entrada: medicion.tokens_entrada,
    cacheados: medicion.tokens_cacheados,
    salida: medicion.tokens_salida,
  });
