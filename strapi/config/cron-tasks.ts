export default {
  // Ejecuta la limpieza todos los días a las 03:00 AM
  '0 3 * * *': async ({ strapi }) => {
    console.log('--- CRON: Iniciando limpieza de predicciones antiguas ---');
    
    // Calcular la fecha límite (7 días atrás)
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);

    try {
      const oldSignals = await strapi.db.query('api::senal-predictiva.senal-predictiva').findMany({
        where: {
          createdAt: {
            $lt: limite,
          },
        },
        select: ['id'],
      });

      if (oldSignals && oldSignals.length > 0) {
        const ids = oldSignals.map(s => s.id);
        
        await strapi.db.query('api::senal-predictiva.senal-predictiva').deleteMany({
          where: {
            id: {
              $in: ids,
            },
          },
        });
        console.log(`--- CRON: Éxito. Se eliminaron ${oldSignals.length} registros antiguos. ---`);
      } else {
        console.log('--- CRON: No hay predicciones con más de 7 días de antigüedad para borrar. ---');
      }
    } catch (err) {
      console.error('--- CRON ERROR: Falló la limpieza de predicciones ---', err);
    }
  },
};
