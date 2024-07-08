import { createClient, RedisClientType } from 'redis';
import { SessionData } from '../../interface';



const { REDIS_HOST, REDIS_PORT} = process.env;


class RedisClient {
    private client: RedisClientType;

    constructor() {
        this.client = createClient({
            url: `redis://${REDIS_HOST}:{REDIS_PORT}`
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        this.client.connect().then(() => {
            console.log('Connected to Redis');
        });
    }

    async set(key: string, value: string): Promise<void> {
        await this.client.set(key, value);
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async setSessionData(sessionId: string, data: SessionData): Promise<void> {
        const value = JSON.stringify(data);
        await this.set(sessionId, value);
    }

    async getSessionData(sessionId: string): Promise<SessionData | null> {
        const value = await this.get(sessionId);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }

    async delSessionData(sessionId: string): Promise<void> {
        await this.del(sessionId);
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

export default RedisClient;
