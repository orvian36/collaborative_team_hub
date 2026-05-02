const { stringify } = require('csv-stringify');

/**
 * Stream rows as CSV. `columns` is `[{ key, header }]`. `rows` is an
 * iterable (sync or async) that yields plain objects.
 *
 * Sets Content-Type and Content-Disposition headers; the caller passes a
 * filename slug.
 */
async function streamCsv(res, { filename, columns, rows }) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

  const stringifier = stringify({
    header: true,
    columns: columns.map((c) => ({ key: c.key, header: c.header })),
    cast: {
      date: (v) => v.toISOString(),
      boolean: (v) => v ? 'true' : 'false',
    },
  });
  stringifier.pipe(res);

  for await (const row of rows) {
    stringifier.write(row);
  }
  stringifier.end();
}

module.exports = { streamCsv };
