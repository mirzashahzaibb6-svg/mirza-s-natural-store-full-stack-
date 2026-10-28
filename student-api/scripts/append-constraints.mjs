// Appends prisma/constraints.sql to the "init" migration exactly once (safe to re-run).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MARK = '-- ONLINEMART_CONSTRAINTS_BEGIN';
const migrationsDir = join(process.cwd(), 'prisma', 'migrations');

if (!existsSync(migrationsDir)) {
  console.error('prisma/migrations not found. Run "npm run db:init" from the student-api folder.');
  process.exit(1);
}
const initDir = readdirSync(migrationsDir).filter((d) => d.endsWith('_init')).sort().pop();
if (!initDir) {
  console.error('No "*_init" migration found.');
  process.exit(1);
}
const file = join(migrationsDir, initDir, 'migration.sql');
const current = readFileSync(file, 'utf8');
if (current.includes(MARK)) {
  console.log(`Constraints already present in ${initDir}.`);
  process.exit(0);
}
const extra = readFileSync(join(process.cwd(), 'prisma', 'constraints.sql'), 'utf8');
writeFileSync(file, `${current.trimEnd()}\n\n${MARK}\n${extra}\n-- ONLINEMART_CONSTRAINTS_END\n`);
console.log(`Constraints appended to ${initDir}/migration.sql`);
