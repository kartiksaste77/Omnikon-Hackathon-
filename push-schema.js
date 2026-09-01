const { createClient } = require('@libsql/client');
const fs = require('fs');

const client = createClient({
  url: 'libsql://skillswap-kartiksaste77.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgyMzY1MTAsImlkIjoiMDFhMDViMmQtYzkwMS03Y2FhLWIyMjktZWQ5ZmU2ZDc4OTkzIiwia2lkIjoiZTFiX3ZIeFZGN2NiV1lnSjZZQlg4d2lwa1MzRVgxRDRmZmdIamUzSU1SOCIsInJpZCI6IjZhMWViNzZmLWNhOGQtNGNmYy05ZDIxLTJmN2UxZTU1NmUzNSJ9.hwmZErCWIwVdwh7tvXh3VhJ_hxJdDzVsl-ogIUdDSr7v5McHsgEEldZXbUgGi3JMXKPU3DzCM9m2LK_1-MGiBw'
});

async function main() {
  const sql = fs.readFileSync('schema.sql', 'utf8');
  // Libsql client allows batch execution, but executeMultiple is safer
  try {
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      await client.execute(statement);
    }
    console.log('Schema pushed to Turso successfully!');
  } catch (e) {
    console.error('Failed to execute schema:', e);
  }
}
main();
