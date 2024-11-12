import pool from '../lib/db';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

import { setTimeout } from 'timers/promises';

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function updateData() {
  try {
    console.log('Script execution started');

    // Step 1: Fetch the current block number
    const currentBlockResponse = await axios.get('https://blockchain.info/q/getblockcount', { httpsAgent });
    const currentBlock = currentBlockResponse.data;

    if (currentBlock < parseInt(process.env.START_BLOCK || '0')) {
      console.log(`Current block is ${currentBlock}, less than ${process.env.START_BLOCK}.`);
      return;
    }

    // Step 2: Initialize variables for pagination
    const limit = 100;
    let offset = 0;
    let allItems: any[] = [];
    let hasMore = true;

    // Step 3: Fetch data with pagination
    while (hasMore) {
      try {
        await setTimeout(500);

        const response = await axios.get('https://api-mainnet.magiceden.dev/v2/ord/btc/tokens', {
          headers: {
            Authorization: `Bearer ${process.env.ME_BEARER_TOKEN}`,
          },
          params: {
            collectionSymbol: 'seizectrl',
            limit,
            offset,
          },
          httpsAgent, // Add the custom HTTPS agent here
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
      const owner = item.owner;
      const listed = item.listed;
      const listedAt = item.listedAt;

      // Check if a matching row exists
      const matchingRow = await pool.query(
        `SELECT * FROM "battleOf404" WHERE "inscriptionId" = $1 AND owner = $2 AND utxo = $3 AND "endBlock" IS NULL`,
        [inscriptionId, owner, output]
      );

      if (matchingRow.rows.length === 0 && !listed) {
        // If no matching row exists and the item is not listed, create a new row
        await pool.query(
          `INSERT INTO "battleOf404"(id, created_at, updated_at, deleted_at, "inscriptionId", owner, utxo, "endAction", "endBlock", details, "startBlock")
           VALUES (DEFAULT, NOW(), NOW(), NULL, $1, $2, $3, NULL, NULL, NULL, $4)`,
          [inscriptionId, owner, output, currentBlock]
        );
        console.log(`Inserted new row for unlisted inscriptionId: ${inscriptionId}`);
      } else if (matchingRow.rows.length === 0 && listed) {
        //if no matching row and item is listed
        await pool.query(
          `INSERT INTO "battleOf404"(id, created_at, updated_at, deleted_at, "inscriptionId", owner, utxo, "endAction", "endBlock", details, "startBlock")
           VALUES (DEFAULT, NOW(), NOW(), NULL, $1, $2, $3, 'listed', $4, $5, $4)`,
          [inscriptionId, owner, output, currentBlock, listedAt]
        );
        console.log(`Inserted new row for listed inscriptionId: ${inscriptionId}`);
      } else if (matchingRow.rows.length > 0) {
        const row = matchingRow.rows[0];

        // Condition 1: output does not match utxo and endBlock is null
        if (output !== row.utxo) {
          await pool.query(
            `UPDATE "battleOf404"
             SET "endBlock" = $1, "endAction" = 'transfer', details = $2, updated_at = NOW()
             WHERE "inscriptionId" = $3 AND "endBlock" IS NULL`,
            [currentBlock, output, inscriptionId]
          );
          console.log(`Updated row for inscriptionId: ${inscriptionId} (transfer)`);
        }

        // Condition 2: listed is true and endBlock is null
        if (listed === true) {
          await pool.query(
            `UPDATE "battleOf404"
             SET "endBlock" = $1, "endAction" = 'listed', details = $2, updated_at = NOW()
             WHERE "inscriptionId" = $3 AND "endBlock" IS NULL`,
            [currentBlock, listedAt, inscriptionId]
          );
          console.log(`Updated row for inscriptionId: ${inscriptionId} (listed)`);
        }
      }
    }

    console.log('Data updated successfully');
    pool.end();
  } catch (error: any) {
    console.error('An error occurred:', error);
    pool.end();
    process.exit(1);
  }
}

updateData();
