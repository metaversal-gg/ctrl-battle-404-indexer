import pool from '../lib/db';
import axios from 'axios';

async function updateData() {
  try {
    console.log('Script execution started');

    // Step 1: Fetch the current block number
    const currentBlockResponse = await axios.get('https://blockchain.info/q/getblockcount');
    const currentBlock = currentBlockResponse.data;

    // Step 2: Initialize variables for pagination
    const limit = 100;
    let offset = 0;
    let allItems: any[] = [];
    let hasMore = true;

    // Step 3: Fetch data with pagination
    while (hasMore) {
      try {
        const response = await axios.get('https://api-mainnet.magiceden.dev/v2/ord/btc/tokens', {
          headers: {
            Authorization: `Bearer ${process.env.ME_BEARER_TOKEN}`,
          },
          params: {
            collectionSymbol: 'seizectrl',
            limit,
            offset,
          },
        });

        const data = response.data;
        allItems = allItems.concat(data.tokens);

        // Check if we have retrieved all items
        if (data.tokens.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    // Step 4: Process each item
    for (const item of allItems) {
      const inscriptionId = item.id;
      const output = item.output;
      const listed = item.listed;
      const listedAt = item.listedAt;

      // Fetch the corresponding row from the database
      const res = await pool.query(
        `SELECT * FROM main_index WHERE "inscriptionId" = $1 AND "endBlock" IS NULL`,
        [inscriptionId]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];

        // Condition 1: output does not match utxo and endBlock is null
        if (output !== row.utxo) {
          await pool.query(
            `UPDATE main_index
             SET "endBlock" = $1, "endAction" = 'transfer', details = $2
             WHERE "inscriptionId" = $3`,
            [currentBlock, output, inscriptionId]
          );
        }

        // Condition 2: listed is true and endBlock is null
        if (listed === true) {
          await pool.query(
            `UPDATE main_index
             SET "endBlock" = $1, "endAction" = 'listed', details = $2
             WHERE "inscriptionId" = $3`,
            [currentBlock, listedAt, inscriptionId]
          );
        }
      }
    }

    console.log('Data updated successfully');
    pool.end(); // Close the database connection
  } catch (error: any) {
    console.error('An error occurred:', error);
    pool.end(); // Ensure the database connection is closed
    process.exit(1); // Exit with an error code
  }
}

updateData();