/**
 * senal-predictiva controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::senal-predictiva.senal-predictiva', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;
    
    const pasoDocumentId = data?.id_paso?.connect?.[0]?.documentId;
    const horizonte = data?.horizonte_horas;

    if (pasoDocumentId && horizonte) {
      // 1. Buscamos si ya existe una predicción para este paso y estas horas
      const existing = await strapi.documents('api::senal-predictiva.senal-predictiva').findFirst({
        filters: { 
          id_paso: { documentId: pasoDocumentId },
          horizonte_horas: horizonte 
        }
      });

      if (existing) {
        // 2. Si existe, en vez de crear uno nuevo (POST), lo actualizamos (PUT encubierto)
        const updated = await strapi.documents('api::senal-predictiva.senal-predictiva').update({
          documentId: existing.documentId,
          data: data,
        });
        
        const sanitizedEntity = await this.sanitizeOutput(updated, ctx);
        return this.transformResponse(sanitizedEntity);
      }
    }

    // 3. Si no existe, lo creamos normalmente
    return super.create(ctx);
  }
}));
