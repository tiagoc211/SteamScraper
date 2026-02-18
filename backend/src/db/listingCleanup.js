// backend/src/db/listingCleanup.js
/**
 * Sistema profissional de limpeza e atualização de listings
 * 
 * Responsabilidades:
 * 1. Detectar listings que não existem mais no mercado
 * 2. Atualizar listings com mudanças de preço
 * 3. Remover listings com segurança (não remover sem confirmar)
 * 4. Substituir listings antigas por novas quando o vendedor muda preço
 */

const pool = require('./index.js');

/**
 * Marca um listing como "possibly_delisted" quando não é encontrada no fetch
 * 
 * LÓGICA CORRETA:
 * - Se listing não foi encontrada E preço <= minPrice → Definitely delisted (passou por ela)
 * - Se listing não foi encontrada E preço > minPrice → Possibly delisted (pode estar adiante)
 * 
 * A primeira é removida rápido, a segunda só depois de múltiplas verificações
 * 
 * @param {string} marketHashName - Nome da skin no mercado
 * @param {number} currentMinPrice - Preço mínimo encontrado no fetch atual
 * @param {array} fetchedListingIds - IDs de listings encontrados no fetch atual
 */
async function markPossiblyDelistedListings(marketHashName, currentMinPrice, fetchedListingIds = []) {
  try {
    // Fase 1: Identifica listings não encontradas que passaram do preço mínimo
    // Estas SÃO definitivamente delisted (fetch começou do mais barato e não as encontrou)
    const definitivelyDelistedQuery = `
      SELECT listing_id, price, delisted_check_count
      FROM listings
      WHERE market_hash_name = $1
        AND listing_id != ALL($2::text[])
        AND price <= $3
        AND delisted_check_count < 3
    `;
    
    const { rows: delistedBelowMin } = await pool.query(definitivelyDelistedQuery, [
      marketHashName,
      fetchedListingIds.length > 0 ? fetchedListingIds : [null],
      currentMinPrice
    ]);

    // Fase 2: Identifica listings não encontradas com preço acima do mínimo
    // Estas PODEM ser delisted, mas só marca se fetch foi recente/confiável
    const possiblyDelistedQuery = `
      SELECT listing_id, price, delisted_check_count
      FROM listings
      WHERE market_hash_name = $1
        AND listing_id != ALL($2::text[])
        AND price > $3
        AND delisted_check_count < 3
    `;
    
    const { rows: delistedAboveMin } = await pool.query(possiblyDelistedQuery, [
      marketHashName,
      fetchedListingIds.length > 0 ? fetchedListingIds : [null],
      currentMinPrice
    ]);

    if (delistedBelowMin.length === 0 && delistedAboveMin.length === 0) return 0;

    // Incrementar contador para as que não foram encontradas
    // As que estão ABAIXO do mínimo incrementam 2x (confirmação rápida)
    // As que estão ACIMA incrementam 1x (podem estar adiante, ser incompleto)
    
    // Increment 2x para as abaixo do mínimo (rápida confirmação)
    if (delistedBelowMin.length > 0) {
      const belowMinIds = delistedBelowMin.map(l => l.listing_id);
      const updateBelowQuery = `
        UPDATE listings
        SET delisted_check_count = delisted_check_count + 2,
            last_delisted_check = CURRENT_TIMESTAMP
        WHERE market_hash_name = $1
          AND listing_id = ANY($2::text[])
        RETURNING listing_id, delisted_check_count
      `;

      const { rows: updatedBelow } = await pool.query(updateBelowQuery, [marketHashName, belowMinIds]);
      console.log(`🔴 ${updatedBelow.length} listings DEFINITIVAMENTE delisted (preço abaixo do mínimo atual)`);
      updatedBelow.forEach(u => {
        const orig = delistedBelowMin.find(d => d.listing_id === u.listing_id);
        console.log(`   - ${u.listing_id} (era €${(orig.price / 100).toFixed(2)}, min agora é €${(currentMinPrice / 100).toFixed(2)})`);
      });
    }

    // Increment 1x para as acima do mínimo (monitorar)
    if (delistedAboveMin.length > 0) {
      const aboveMinIds = delistedAboveMin.map(l => l.listing_id);
      const updateAboveQuery = `
        UPDATE listings
        SET delisted_check_count = delisted_check_count + 1,
            last_delisted_check = CURRENT_TIMESTAMP
        WHERE market_hash_name = $1
          AND listing_id = ANY($2::text[])
        RETURNING listing_id, delisted_check_count
      `;

      const { rows: updatedAbove } = await pool.query(updateAboveQuery, [marketHashName, aboveMinIds]);
      console.log(`🟡 ${updatedAbove.length} listings POSSÍVEL delisted (preço acima do mínimo, monitorando)`);
    }

    return delistedBelowMin.length + delistedAboveMin.length;

  } catch (err) {
    console.error('Erro ao marcar listings como delisted:', err);
    throw err;
  }
}

/**
 * Remove permanentemente listings que foram confirmados como delisted
 * (passou do preço mínimo em 3+ ciclos consecutivos de fetch)
 * 
 * @param {string} marketHashName - Nome da skin no mercado
 * @returns {number} Quantidade de listings removidas
 */
async function removeConfirmedDelistedListings(marketHashName) {
  try {
    const query = `
      DELETE FROM listings
      WHERE market_hash_name = $1
        AND delisted_check_count >= 3
      RETURNING listing_id, price
    `;

    const { rows: removed } = await pool.query(query, [marketHashName]);

    if (removed.length > 0) {
      console.log(`🗑️  ${removed.length} listings delisted confirmadas removidas de '${marketHashName}'`);
      removed.forEach(r => {
        console.log(`   - Listing ${r.listing_id} (preço: €${(r.price / 100).toFixed(2)})`);
      });
    }

    return removed.length;

  } catch (err) {
    console.error('Erro ao remover listings delisted:', err);
    throw err;
  }
}

/**
 * Atualiza ou insere listings considerando mudanças de preço
 * Se um listing antigo tem listing_id diferente com mesmo item_id mas preço diferente,
 * remove o antigo e insere o novo
 * 
 * @param {array} newListings - Listings novos do fetch
 * @param {string} marketHashName - Nome da skin
 * @returns {object} Status da operação
 */
async function updateListingsWithPriceCheck(newListings, marketHashName) {
  if (!newListings || newListings.length === 0) {
    return { inserted: 0, updated: 0, replaced: 0, deleted: 0 };
  }

  const stats = { inserted: 0, updated: 0, replaced: 0, deleted: 0 };

  try {
    // Para cada listing novo, verificar se existe algo parecido com preço diferente
    for (const newListing of newListings) {
      const { listing_id, item_id, price, float_value, paint_seed } = newListing;

      // Buscar listings antigos do mesmo item com float/seed parecido mas preço diferente
      // Isso indica que o vendedor atualizou o preço
      const checkQuery = `
        SELECT listing_id, price, float_value, paint_seed
        FROM listings
        WHERE item_id = $1
          AND ABS(float_value - $2) < 0.001
          AND paint_seed = $3
          AND price != $4
          AND listing_id != $5
        LIMIT 1
      `;

      const { rows: oldListings } = await pool.query(checkQuery, [
        item_id,
        float_value || 0,
        paint_seed || 0,
        price,
        listing_id
      ]);

      // Se encontrou uma listing antiga com mesmo float/seed mas preço diferente
      if (oldListings.length > 0) {
        const oldListing = oldListings[0];
        console.log(`🔄 Substituindo listing de preço: ${oldListing.listing_id} (€${(oldListing.price / 100).toFixed(2)}) → ${listing_id} (€${(price / 100).toFixed(2)})`);
        
        // Remover a antiga
        await pool.query('DELETE FROM listings WHERE listing_id = $1', [oldListing.listing_id]);
        stats.deleted++;
        stats.replaced++;
      }

      // Fazer upsert normal da nova listing
      const upsertQuery = `
        INSERT INTO listings (
          listing_id, item_id, price, fee, float_value, paint_seed, 
          stickers, keychains, inspect_link, market_hash_name, icon_url,
          delisted_check_count, last_delisted_check
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, NULL)
        ON CONFLICT (listing_id) DO UPDATE SET
          price = EXCLUDED.price,
          fee = EXCLUDED.fee,
          float_value = EXCLUDED.float_value,
          stickers = EXCLUDED.stickers,
          keychains = EXCLUDED.keychains,
          icon_url = EXCLUDED.icon_url,
          delisted_check_count = 0,
          last_delisted_check = NULL,
          scraped_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) as is_insert
      `;

      const { rows: result } = await pool.query(upsertQuery, [
        listing_id,
        item_id,
        price,
        newListing.fee || 0,
        float_value || null,
        paint_seed || null,
        newListing.stickers || null,
        newListing.keychains || null,
        newListing.inspect_link || null,
        marketHashName,
        newListing.icon_url || null
      ]);

      if (result[0]?.is_insert) {
        stats.inserted++;
      } else {
        stats.updated++;
      }
    }

    return stats;

  } catch (err) {
    console.error('Erro ao atualizar listings com verificação de preço:', err);
    throw err;
  }
}

/**
 * Limpa listings marcadas como delisted se tiverem sido marcadas há mais de X horas
 * sem ser encontradas novamente (indica que realmente não existem)
 * 
 * @param {number} hoursThreshold - Quantas horas de espera antes de remover (padrão: 24)
 * @returns {number} Quantidade removida
 */
async function cleanupDelistedListingsByTime(hoursThreshold = 24) {
  try {
    const query = `
      DELETE FROM listings
      WHERE delisted_check_count >= 3
        AND last_delisted_check < CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $1)
      RETURNING listing_id, market_hash_name
    `;

    const { rows: removed } = await pool.query(query, [hoursThreshold]);

    if (removed.length > 0) {
      console.log(`🧹 Limpeza de listings delisted: ${removed.length} removidas`);
    }

    return removed.length;

  } catch (err) {
    console.error('Erro ao fazer cleanup de delisted listings:', err);
    throw err;
  }
}

/**
 * Reset de contadores de delisted para listings que foram encontradas novamente
 * (Caso o item tenha regressado ao mercado)
 */
async function resetDelistedCounterForFoundListings(marketHashName, fetchedListingIds) {
  try {
    if (fetchedListingIds.length === 0) return 0;

    const query = `
      UPDATE listings
      SET delisted_check_count = 0,
          last_delisted_check = NULL
      WHERE market_hash_name = $1
        AND listing_id = ANY($2::text[])
        AND delisted_check_count > 0
      RETURNING listing_id
    `;

    const { rows: reset } = await pool.query(query, [marketHashName, fetchedListingIds]);

    if (reset.length > 0) {
      console.log(`✅ ${reset.length} listings encontradas novamente, contadores resetados`);
    }

    return reset.length;

  } catch (err) {
    console.error('Erro ao resetar contadores delisted:', err);
    throw err;
  }
}

/**
 * Função principal de processamento - Integra todo o fluxo
 */
async function processListingChanges(marketHashName, newListings, steamMinPrice = 0) {
  try {
    console.log(`\n📋 Processando mudanças de listings para: ${marketHashName}`);

    const stats = {
      inserted: 0,
      updated: 0,
      replaced: 0,
      deleted: 0,
      marked_delisted: 0
    };

    // 1. Reset contadores para listings encontradas novamente
    const foundListingIds = newListings.map(l => l.listing_id);
    await resetDelistedCounterForFoundListings(marketHashName, foundListingIds);

    // 2. Atualizar/inserir listings novas com verificação de preço
    const updateStats = await updateListingsWithPriceCheck(newListings, marketHashName);
    Object.assign(stats, updateStats);

    // 3. Marcar como possível delisted as que passaram do preço mínimo
    const markedDelisted = await markPossiblyDelistedListings(marketHashName, steamMinPrice, foundListingIds);
    stats.marked_delisted = markedDelisted;

    // 4. Remover confirmadas delisted (3+ verificações)
    const deleted = await removeConfirmedDelistedListings(marketHashName);
    stats.deleted = deleted;

    // 5. Limpeza de antigas delisted (mais de 24h sem ser encontradas)
    await cleanupDelistedListingsByTime(24);

    console.log(`📊 Resumo de mudanças para '${marketHashName}':`);
    console.log(`   ✓ Inseridas: ${stats.inserted}`);
    console.log(`   ✓ Atualizadas: ${stats.updated}`);
    console.log(`   ✓ Substituídas: ${stats.replaced}`);
    console.log(`   ✓ Removidas (delisted): ${stats.deleted}`);
    console.log(`   ✓ Marcadas possível delisted: ${stats.marked_delisted}`);

    return stats;

  } catch (err) {
    console.error('Erro fatal em processamento de listings:', err);
    throw err;
  }
}

module.exports = {
  markPossiblyDelistedListings,
  removeConfirmedDelistedListings,
  updateListingsWithPriceCheck,
  cleanupDelistedListingsByTime,
  resetDelistedCounterForFoundListings,
  processListingChanges
};
