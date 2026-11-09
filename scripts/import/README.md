# Import of the historical prospetti (Excel)

The association keeps its past prospetti as Excel files (`Anno 2020` … `Anno 2026`). These scripts read them and
produce an SQL file **to review** and then run by hand: nothing is written to the database by the scripts that
read the files. Personal data (names, addresses) is in the output: keep it in `.local/`, which is git-ignored.

```
Excel files ──extract_excel.py──▶ extracted.json ──generate-sql.ts──▶ import.sql + report.md + report.csv + manifest.json
                                                                                │ (you review, then run import.sql)
                                          database ◀──────────────────────────┘
                                          verify-import.ts: database == manifest ?
```

## 1. Read the Excel files

```sh
python -I scripts/import/extract_excel.py ".local/import/zip" ".local/import/extracted.json"
```

(Unzip the files received into a folder first. Only the standard library of Python 3 is used.)

The files come from three versions of the same workbook (the sheets have other names, some cells moved), so a
value is looked for next to its label, or through the formulas that link the sheets, never in a fixed cell. What
cannot be found is written in the `warnings` of that file and ends up in the report.

## 2. Make the SQL and the report

```sh
npm run import:sql -- .local/import/extracted.json .local/import/out --importer name@example.it
```

`--importer` is the email of an existing user: the documents are saved as created by that user (with the date of the
document as creation date, so that the list shows them in order).

For each file the application recalculates the prospetto with its own engine and compares it with what the Excel
file itself calculated (conventional surface, sum of the surcharges, monthly minimum and maximum, the partial
lease). **`report.md` lists the files for which the numbers differ**: these are the ones to look at. The ISTAT
coefficients are those written in the Excel file, when it has them, so that a document issued long ago does not
change if the table of the application is corrected later.

The numbers the association gave are **not used** (they started again every year and a few are repeated). The
documents are numbered again from 1, oldest first (documents of the same day keep the association's order), in the
sequence of the application (`src/lib/documents/numbering.ts`: one for every kind and territory, whatever the year),
so that the ones created from now on continue from the last. `report.csv` has the old and the new number side by
side (to find the original file and its PDF), and the audit row of the import keeps the same correspondence.

## 3. Review and run

Open `import.sql` (one transaction: all or nothing; running it twice fails without changing anything because the
numbers are unique), then apply it. The file is large (about 1.5 MB), so rather than pasting it in a web editor use

```sh
npm run import:apply -- .local/import/out/import.sql
```

which shows the database it will act on (host, name, how many users and documents it holds) and asks to type the
name. For production set the variable for that command only (PowerShell: `$env:DATABASE_URL_UNPOOLED = "<direct
url>"; npm run import:apply -- ...`). The file is pure ASCII (accents are written as escapes), so the encoding the
tool assumes does not matter. If documents were already imported with errors, start again with `npm run db:fresh`
(and create the user again) rather than patching them.

### On a database that already has documents (production)

`import.sql` also takes care of the prospetti of the Comune made in the application before the import (the imported
ones are in the same sequence, `prospectus:city`): they keep their order and are renumbered after the imported ones
(548, 549, ...), with their search text and the counter updated. The other sequences (prospetti of the Provincia,
attestazioni), the users, the sessions and everything else are left alone. Suggested order:

1. Take a backup (Neon: a branch, or a dump) and try the SQL on a copy first.
2. Run `import.sql` on production, at a time when nobody is creating Comune prospetti (one created in the middle
   would take a number the import is about to use, and the import would fail without changing anything).
3. Run the check below against production.

The import puts the documents in one sequence (`prospectus:city`, numbers 1 to 547). The numbering of the application
is yearly: run `npm run db:renumber` after the import (and run the check below *before* it, as it expects these
numbers).

## 4. Check the database

```sh
npm run import:verify -- .local/import/out/manifest.json
```

Compares every document in the database (date, name, address, input, result) with the manifest and the counters
with the last numbers. It only reads. Then open some documents in the application next to their PDF (the report
says which files have none).
