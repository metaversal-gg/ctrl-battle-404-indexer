import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function GET(request: NextRequest) {
  try {
    const currentBlockResponse = await axios.get('https://blockchain.info/q/getblockcount');
    const currentBlock = currentBlockResponse.data;

    const limit = 100;
    let offset = 0;
    let allItems: any[] = [];
    let hasMore = true;

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

    for (const item of allItems) {
      const inscriptionId = item.id;
      const output = item.output;
      const listed = item.listed;
      const listedAt = item.listedAt;

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

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
