import { useWebSocketImplementation, SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import WebSocket from 'ws';
import { relays } from './config.js';
import { nip19 } from 'nostr-tools';
import 'dotenv/config';

useWebSocketImplementation(WebSocket);

console.log("Start");
const sk = process.env.SK_HEX;
console.log(sk);

const pool = new SimplePool();

pool.subscribe(
    relays,
    {
        kinds: [9321],
        since: Math.floor(Date.now() / 1000),
    },
    {
        async onevent(event) {
            const recipient = event.tags.find((tag) => tag[0] == "p")[1];
            const amount = event.tags.filter((tag) => tag[0] == "proof").map((tag) => JSON.parse(tag[1]).amount).reduce((a, b) => a + b);

            let eventTemplate = {
                kind: 1,
                created_at: Math.floor(Date.now() / 1000),
                tags: [],
                content: `nostr:${nip19.npubEncode(recipient)} received a Nutzap of ${amount} sat${amount > 1 ? "s" : ""} from nostr:${nip19.npubEncode(event.pubkey)} whith note: ${event.content}`,
            }

            const signedEvent = finalizeEvent(eventTemplate, sk);
            await Promise.allSettled(pool.publish(relays, signedEvent));
        }
    }
);
