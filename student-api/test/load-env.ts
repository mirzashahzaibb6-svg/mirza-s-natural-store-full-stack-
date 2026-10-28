import * as dotenv from 'dotenv';
import { join } from 'node:path';

// Test env always wins over any shell/.env values.
dotenv.config({ path: join(__dirname, '..', '.env.test'), override: true });
