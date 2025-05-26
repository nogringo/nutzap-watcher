import { useWebSocketImplementation, SimplePool } from 'nostr-tools/pool';
import { finalizeEvent } from 'nostr-tools/pure';
import WebSocket from 'ws';
import { relays } from './config.js';
import { nip19 } from 'nostr-tools';
import 'dotenv/config';
import { getEncodedTokenV4 } from '@cashu/cashu-ts';

useWebSocketImplementation(WebSocket);

const sk = process.env.SK_HEX;

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
            const mintUrl = event.tags.find((tag) => tag[0] == "u")[1];
            const proofs = event.tags.filter((tag) => tag[0] == "proof").map((tag) => JSON.parse(tag[1]));
            const token = getEncodedTokenV4({ mint: mintUrl, proofs: proofs });
            const amount = proofs.map((proof) => proof.amount).reduce((a, b) => a + b);

            const notificationEvent = {
                kind: 1,
                created_at: Math.floor(Date.now() / 1000),
                tags: [["p", recipient]],
                content: `nostr:${nip19.npubEncode(recipient)} received a Nutzap of ${amount} sat${amount > 1 ? "s" : ""} from nostr:${nip19.npubEncode(event.pubkey)} whith note: ${event.content}\n\n${token}`,
            }

            const signedNotificationEvent = finalizeEvent(notificationEvent, sk);
            await Promise.allSettled(pool.publish(relays, signedNotificationEvent));
        }
    }
);
