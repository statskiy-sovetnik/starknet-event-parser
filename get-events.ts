import { RpcProvider, num, hash } from 'starknet';
import { config } from './config';
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
  const myNodeUrl = process.env.NODE_URL;
  const provider = new RpcProvider({ nodeUrl: `${myNodeUrl}` });

  const lastBlock = await provider.getBlock('latest');
  const eventName = config.EVENT;

  // if the event is nested inside a component, skip 1 hash (first array stays empty)
  const keyFilter = [[num.toHex(hash.starknetKeccak(eventName))]];

  const blocksInterval = 10;

  let continuationToken: string | undefined = '0';
  let chunkNum: number = 1;
  while (continuationToken) {
    const eventsRes = await provider.getEvents({
      address: config.CONTRACT_ADDRESS,
      from_block: { block_number: config.FROM_BLOCK || lastBlock.block_number - blocksInterval },
      to_block: { block_number: lastBlock.block_number },
      keys: keyFilter,
      chunk_size: 10,
    });

    const nbEvents = eventsRes.events.length;
    continuationToken = eventsRes.continuation_token;
    console.log('chunk nb =', chunkNum, '.', nbEvents, 'events recovered.');
    console.log('continuation_token =', continuationToken);
    for (let i = 0; i < nbEvents; i++) {
      const event = eventsRes.events[i];
      console.log(
        'event #',
        i,
        `tx = `,
        event.transaction_hash,
        'data length =',
        event.data.length,
        'key length =',
        event.keys.length,
        ':'
      );
      console.log('\nkeys =', event.keys, 'data =', event.data);
    }
    chunkNum++;
  }

  console.log("\nParsing finished");   
})();
