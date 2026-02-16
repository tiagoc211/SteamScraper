// Temporary script to add test float values to some listings for testing
const pool = require('./src/db/index.js');

async function addTestFloats() {
  try {
    // Update some random listings with realistic float values
    const updateQuery = `
      UPDATE listings
      SET float_value = (RANDOM() * 0.5)::DOUBLE PRECISION,
          paint_seed = FLOOR(RANDOM() * 1000)::INT
      WHERE listing_id IN (
        SELECT listing_id 
        FROM listings 
        WHERE market_hash_name IS NOT NULL 
        ORDER BY RANDOM() 
        LIMIT 50
      );
    `;
    
    const result = await pool.query(updateQuery);
    console.log(`✅ Added float values to ${result.rowCount} listings`);
    
    // Show some examples
    const examplesQuery = `
      SELECT market_hash_name, float_value, paint_seed, price
      FROM listings
      WHERE float_value IS NOT NULL
      ORDER BY float_value ASC
      LIMIT 10;
    `;
    
    const examples = await pool.query(examplesQuery);
    console.log('\n📊 Top 10 lowest floats:');
    examples.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.market_hash_name}`);
      console.log(`   Float: ${row.float_value.toFixed(14)}, Seed: ${row.paint_seed}, Price: €${(row.price/100).toFixed(2)}`);
    });
    
  } catch (err) {
    console.error('Error adding test floats:', err);
  } finally {
    await pool.end();
  }
}

addTestFloats();
