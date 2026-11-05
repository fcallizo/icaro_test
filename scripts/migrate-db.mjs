import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { neon } from '@neondatabase/serverless';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error('Define DATABASE_URL en el entorno o en .env.local.');
}

function splitSqlStatements(source) {
  const statements = [];
  let start = 0;
  let index = 0;
  let quote = null;
  let dollarQuote = null;
  let blockCommentDepth = 0;
  let lineComment = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (current === '\n') lineComment = false;
      index += 1;
      continue;
    }

    if (blockCommentDepth > 0) {
      if (current === '/' && next === '*') {
        blockCommentDepth += 1;
        index += 2;
      } else if (current === '*' && next === '/') {
        blockCommentDepth -= 1;
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }

    if (dollarQuote) {
      if (source.startsWith(dollarQuote, index)) {
        index += dollarQuote.length;
        dollarQuote = null;
      } else {
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (current === quote) {
        if (next === quote) {
          index += 2;
        } else {
          quote = null;
          index += 1;
        }
      } else {
        index += 1;
      }
      continue;
    }

    if (current === '-' && next === '-') {
      lineComment = true;
      index += 2;
    } else if (current === '/' && next === '*') {
      blockCommentDepth = 1;
      index += 2;
    } else if (current === '\'' || current === '"') {
      quote = current;
      index += 1;
    } else if (current === '$') {
      const delimiter = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(source.slice(index))?.[0];
      if (delimiter) {
        dollarQuote = delimiter;
        index += delimiter.length;
      } else {
        index += 1;
      }
    } else if (current === ';') {
      const statement = source.slice(start, index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
      index += 1;
    } else {
      index += 1;
    }
  }

  if (quote || dollarQuote || blockCommentDepth > 0) {
    throw new Error('El archivo SQL contiene una cadena o comentario sin cerrar.');
  }

  const lastStatement = source.slice(start).trim();
  if (lastStatement) statements.push(lastStatement);
  return statements;
}

const migrationSql = await readFile(new URL('./init-db.sql', import.meta.url), 'utf8');
const statements = splitSqlStatements(migrationSql);
const sql = neon(process.env.DATABASE_URL);

await sql.transaction(statements.map((statement) => sql.query(statement)));
console.log(`Migración completada: ${statements.length} sentencias aplicadas.`);
