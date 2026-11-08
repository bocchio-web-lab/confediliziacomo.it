"""Reads the historical Excel prospetti of the association and writes what they contain as JSON.

Nothing here touches the database: the JSON is the input of `generate-sql.ts`, which makes the SQL to review.
Only the standard library is used (an .xlsx file is a zip of XML files), so there is nothing to install.

Usage: python -I scripts/import/extract_excel.py <folder with the "Anno ..." folders> <output.json>

The files come from a few versions of the same workbook: the sheets have other names and some cells moved by a
row or a column. For this reason a value is never read from a fixed cell: it is searched next to its label
("MICROZONA", "Superficie calpestabile appartamento", ...) or through the formulas that already link the sheets
(the formula that adds up the classification parameters says which cells hold the checkboxes). Whatever cannot be
found is reported in `warnings` instead of being guessed.
"""

import json
import re
import sys
import zipfile
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
MAIN = "{%s}" % NS["m"]

SURFACE_LABELS = {
    "net": "superficie calpestabile appartamento",
    "singleGarage": "autorimessa singola",
    "sharedParking": "posto auto in autorimessa comune",
    "accessories": "balconi, terrazzi",
    "outdoorArea": "area scoperta di pertinenza",
}
STREET_WORDS = r"via|viale|v\.le|piazza|p\.zza|piazzale|salita|largo|strada|vicolo|corso|c\.so|lungo|loc\.?|località"
EXCEL_EPOCH = date(1899, 12, 30)


# --- Reading the workbook ---------------------------------------------------------------------------------------


class Sheet:
    """Cells of a sheet: `cells[(row, column)] = (cached value, formula)`; columns are numbers (A = 1)."""

    def __init__(self, name):
        self.name = name
        self.cells = {}

    def value(self, row, column):
        return self.cells.get((row, column), (None, None))[0]

    def formula(self, row, column):
        return self.cells.get((row, column), (None, None))[1]

    def rows(self):
        return sorted({row for row, _ in self.cells})

    def row_cells(self, row):
        return sorted((column, *self.cells[(row, column)]) for r, column in self.cells if r == row)

    def find_text(self, matches):
        """Cells (row, column, text) whose text satisfies `matches`, in reading order."""
        found = [
            (row, column, value.strip())
            for (row, column), (value, _) in self.cells.items()
            if isinstance(value, str) and matches(value.strip())
        ]
        return sorted(found)


def column_number(letters):
    number = 0
    for letter in letters:
        number = number * 26 + ord(letter) - 64
    return number


def split_reference(reference):
    match = re.fullmatch(r"\$?([A-Z]+)\$?(\d+)", reference)
    return int(match.group(2)), column_number(match.group(1))


def read_workbook(path):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            for item in ElementTree.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", NS):
                strings.append("".join(t.text or "" for t in item.iter(MAIN + "t")))

        workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        relations = {
            relation.get("Id"): relation.get("Target")
            for relation in ElementTree.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        }
        sheets = []
        for entry in workbook.find("m:sheets", NS):
            target = relations[entry.get("{%s}id" % NS["r"])].lstrip("/")
            sheet = Sheet(entry.get("name"))
            root = ElementTree.fromstring(archive.read(target if target.startswith("xl/") else "xl/" + target))
            for cell in root.iter(MAIN + "c"):
                kind = cell.get("t")
                raw = cell.find("m:v", NS)
                formula = cell.find("m:f", NS)
                value = None
                if kind == "s" and raw is not None:
                    value = strings[int(raw.text)]
                elif kind == "inlineStr":
                    value = "".join(t.text or "" for t in cell.iter(MAIN + "t"))
                elif raw is not None:
                    value = raw.text
                    if kind in (None, "n"):
                        try:
                            value = float(value)
                        except ValueError:
                            pass
                formula_text = formula.text if formula is not None else None
                if value is not None or formula_text:
                    sheet.cells[split_reference(cell.get("r"))] = (value, formula_text)
            sheets.append(sheet)
        return sheets


# --- Finding the values -----------------------------------------------------------------------------------------


def number_after(sheet, label_matches):
    """First number to the right of the first cell whose text satisfies `label_matches`."""
    for row, column, _ in sheet.find_text(label_matches):
        for other, value, _ in sheet.row_cells(row):
            if other > column and isinstance(value, float):
                return value
    return None


def amount_after_unit(sheet, label_matches):
    """The area typed next to a label: the cell right after its 'mq.' unit, which is 0 when left empty.

    (Reading the first number to the right would pick up the coefficient printed after the area, e.g. 70 %.)
    Returns None when the label or its unit is not there.
    """
    for row, column, _ in sheet.find_text(label_matches):
        for other, value, _ in sheet.row_cells(row):
            if other > column and isinstance(value, str) and value.strip() == "mq.":
                amount = sheet.value(row, other + 1)
                return amount if isinstance(amount, float) else 0.0
    return None


def numbers_after(sheet, label_matches):
    for row, column, _ in sheet.find_text(label_matches):
        return [value for other, value, _ in sheet.row_cells(row) if other > column and isinstance(value, float)]
    return []


def text_after(sheet, label_matches):
    for row, column, _ in sheet.find_text(label_matches):
        for other, value, formula in sheet.row_cells(row):
            if other > column and isinstance(value, str) and value.strip():
                return value.strip(), formula is not None
    return None, False


def starts(prefix):
    return lambda text: text.lower().startswith(prefix)


def iso_date(serial):
    if serial is None or serial < 30000 or serial > 80000:
        return None
    return (EXCEL_EPOCH + timedelta(days=int(serial))).isoformat()


def date_after(sheet, label_matches):
    """The date next to a label: an Excel date, or (in a few files) a text such as '29/12/2020,'."""
    serial = number_after(sheet, label_matches)
    if serial is not None:
        return iso_date(serial)
    text, _ = text_after(sheet, label_matches)
    match = re.search(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})", text or "")
    return date(int(match.group(3)), int(match.group(2)), int(match.group(1))).isoformat() if match else None


def is_checked(value):
    return str(value).strip().upper() in ("1", "TRUE", "VERO")


def referenced_cells(formula):
    """Cells a formula that adds up checkbox cells refers to, in order: [(sheet name or None, row, column)]."""
    return [
        (sheet, *split_reference(reference))
        for sheet, reference in re.findall(r"(?:'?([\w ]+)'?!)?(\$?[A-Z]{1,3}\$?\d+)", formula)
    ]


def find_sheet(sheets, name, default):
    return next((sheet for sheet in sheets if sheet.name == name), default)


def classify_sheets(sheets):
    """The sheet with the document and the one with the checkboxes and the rates (named 'calcolo' or 'Foglio2')."""
    document = next((s for s in sheets if s.find_text(lambda t: "PROSPETTO DI CALCOLO DEL CANONE" in t.upper())), None)
    if document is None:
        document = next((s for s in sheets if s.find_text(starts("calcolo della superficie"))), None)
    # The document sheet also holds "(fascia A)" when that energy class is chosen: the rates sheet has both lists.
    calculation = next(
        (
            s
            for s in sheets
            if s is not document and s.find_text(lambda t: t == "(fascia A)") and s.find_text(lambda t: t == "(anni 4)")
        ),
        None,
    )
    partial = next((s for s in sheets if s.find_text(lambda t: "LOCAZIONI PARZIALI" in t.upper())), None)
    return document, calculation, partial


def checkbox_values(document, calculation, warnings):
    """Parameters 1-13 that are on, and the "bathroom outside the apartment" flag."""
    parameters, no_indoor_bathroom = [], False
    groups = []
    for row, column, label in document.find_text(lambda t: re.match(r"parametri da (1 a 7|8 a 13)", t)):
        # The formula that adds up the checkboxes is the nearest formula to the left of the label.
        formulas = [(other, formula) for other, _, formula in document.row_cells(row) if other < column and formula]
        if formulas and "!" in formulas[-1][1]:
            groups.append((1 if label.startswith("parametri da 1") else 8, formulas[-1][1]))

    for first_number, formula in groups:
        for index, (sheet_name, row, column) in enumerate(referenced_cells(formula)):
            sheet = find_sheet([calculation], sheet_name, calculation) if sheet_name else document
            if sheet is None:
                continue
            number = first_number + index
            if not is_checked(sheet.value(row, column) or 0):
                continue
            if number == 14:
                no_indoor_bathroom = True
            elif number <= 13:
                parameters.append(number)
    if len(groups) != 2:
        warnings.append("Formule dei parametri di classificazione non trovate.")
    return sorted(parameters), no_indoor_bathroom


def surcharge_values(document, calculation, warnings):
    """Which surcharges are on, with the energy class and the duration chosen on the document sheet."""
    keys = ["historic", "furnished", "energyClass", "duration", "electricHeating"]
    anchor = calculation.find_text(lambda t: t == "(fascia A)")[0]
    rows = [anchor[0] + offset for offset in range(5)]

    enabled = {}
    for key, row in zip(keys, rows):
        formulas = [formula for _, _, formula in calculation.row_cells(row) if formula and "=TRUE" in formula]
        match = re.search(r"\$?([A-Z]{1,2})\$?(\d+)=TRUE", formulas[0]) if formulas else None
        enabled[key] = is_checked(calculation.value(int(match.group(2)), column_number(match.group(1)))) if match else None
        if match is None:
            warnings.append(f"Maggiorazione '{key}': casella non trovata.")

    energy_cells = document.find_text(lambda t: bool(re.fullmatch(r"\(fascia [A-E]\)", t)))
    duration_cells = document.find_text(lambda t: bool(re.fullmatch(r"\(anni (4|5|6 e oltre)\)", t)))
    energy_class = energy_cells[0][2][-2] if energy_cells else None
    duration = duration_cells[0][2][6] if duration_cells else None

    values = {
        "historic": bool(enabled["historic"]),
        "furnished": bool(enabled["furnished"]),
        "electricHeating": bool(enabled["electricHeating"]),
        "energyClass": "none",
        "duration": "3",
    }
    if enabled["energyClass"]:
        if energy_class:
            values["energyClass"] = energy_class
        else:
            warnings.append("Classe energetica attiva ma non indicata.")
    if enabled["duration"]:
        if duration:
            values["duration"] = duration
        else:
            warnings.append("Durata maggiorata attiva ma non indicata.")
    return values


def excel_results(document, calculation, warnings):
    """What Excel itself calculated, to check our results against it."""
    minimum_row = numbers_after(document, starts("canone mensile stabilito"))
    fascia, _ = text_after(document, starts("fascia di appartenenza"))
    total_surface = number_after(document, lambda t: t.lower().startswith("totale superficie"))

    percent_sum = None
    for (row, column), (value, formula) in calculation.cells.items():
        if formula and re.fullmatch(r"SUM\(C\d+:C\d+\)", formula.replace(" ", "")):
            percent_sum = value
    istat = {}
    for (row, column), (value, _) in calculation.cells.items():
        if column == 20 and isinstance(value, float) and 30000 < value < 80000:
            coefficient = calculation.value(row, 21)
            if isinstance(coefficient, float):
                istat[iso_date(value)] = coefficient

    if len(minimum_row) < 2:
        warnings.append("Canone mensile minimo/massimo di Excel non trovato.")
    return {
        "minMonthly": minimum_row[0] if minimum_row else None,
        "maxMonthly": minimum_row[1] if len(minimum_row) > 1 else None,
        "fascia": fascia.lower() if fascia else None,
        "totalSurface": total_surface,
        "surchargeSum": percent_sum if isinstance(percent_sum, float) else None,
        "istatTable": istat,
    }


def parse_address(text):
    """'Unità abitativa sita a Como in Via X n. 5, piano 2 int. 3' -> street, unit, and the text left over."""
    if not text:
        return {"raw": None, "address": "", "unit": ""}
    remainder = re.sub(r"^.*?\bsit[ao]\b\s*", "", text, flags=re.I)
    remainder = re.sub(r"^(?:a\s+)?(?:como\s+)?(?:in\s+)?", "", remainder.strip(), flags=re.I)
    # "piano" may be glued to what comes before and after it ("n. 71piano 2", "piano1 int.").
    parts = re.split(r",?\s*(?:piano(?![a-z])|\bp\.?\s*t\b)", remainder, maxsplit=1, flags=re.I)
    address = parts[0].strip(" ,.")
    unit = ""
    if len(parts) > 1:
        unit_match = re.search(r"\bint(?:erno)?\.?\s*([^\s,/]+)", parts[1], flags=re.I)
        unit = unit_match.group(1).strip(".") if unit_match else ""
        unit = unit if re.search(r"\w", unit) else ""
    return {"raw": text, "address": address, "unit": unit}


def name_from_file(stem):
    """'47 Studio Figini Via Rota 10' -> (47, 'Studio Figini', 'Via Rota 10')."""
    match = re.match(r"^\s*(\d+)\s*(.*)$", stem)
    number, rest = (int(match.group(1)), match.group(2).strip()) if match else (None, stem.strip())
    # "_" also separates words in some file names ("Studio Como_via Rezzonico 12").
    street = re.search(rf"(?<![^\W_])(?:{STREET_WORDS})(?![^\W_])", rest, flags=re.I)
    if street and street.start() > 0:
        return number, clean_name(rest[: street.start()]), rest[street.start():].strip()
    return number, clean_name(rest), ""


def clean_name(text):
    """'Monti Roberto_Cesare_' -> 'Monti Roberto Cesare'."""
    return re.sub(r"\s+", " ", text.replace("_", " ")).strip(" -,.")


# --- One file ----------------------------------------------------------------------------------------------------


def extract(path, root):
    warnings = []
    sheets = read_workbook(path)
    document, calculation, partial = classify_sheets(sheets)
    if document is None or calculation is None:
        return {"warnings": ["Struttura del file non riconosciuta."], "recognised": False}

    surfaces = {key: amount_after_unit(document, starts(label)) for key, label in SURFACE_LABELS.items()}
    for key, value in surfaces.items():
        if value is None:
            warnings.append(f"Superficie '{key}' non trovata.")
    surfaces = {key: value or 0.0 for key, value in surfaces.items()}

    floor = number_after(document, lambda t: bool(re.match(r"unit.{1,2}\s*abitativa sita al piano", t, flags=re.I)))
    zone = number_after(document, lambda t: t.lower().startswith("microzona"))
    sheet_number = number_after(document, lambda t: t == "N.")
    prospectus_date = date_after(document, lambda t: t.lower().startswith("como, l"))
    if zone is None:
        warnings.append("Microzona non trovata.")
    if prospectus_date is None:
        warnings.append("Data non trovata.")

    address_cells = document.find_text(
        lambda t: bool(re.match(r"(unit.{1,2}\s*abitativa sit|immobile sit)", t, flags=re.I)) and "PIANO N" not in t.upper()
    )
    address_text = address_cells[0][2] if address_cells else None

    if floor is None:
        # The floor cell was left empty: the address line usually says it ("piano T", "piano 2").
        match = re.search(r"\bpiano\s*[:.]?\s*(\d+|t\b|terra)", address_text or "", flags=re.I)
        if match:
            floor = 0.0 if not match.group(1).isdigit() else float(match.group(1))
            warnings.append(f"Piano ricavato dalla riga dell'indirizzo ('{match.group(0)}').")
        else:
            warnings.append("Piano non trovato.")

    parameters, no_indoor_bathroom = checkbox_values(document, calculation, warnings)
    surcharges = surcharge_values(document, calculation, warnings)

    partial_lease = None
    partial_excel = None
    if partial is not None:
        rent = numbers_after(partial, starts("canone mensile stabilito"))
        partial_excel = {"minMonthly": rent[0], "maxMonthly": rent[1]} if len(rent) > 1 else None
        tenant = amount_after_unit(partial, starts("superficie in uso esclusivo al conduttore"))
        others = amount_after_unit(partial, starts("superficie in uso esclusivo ad altri"))
        if tenant or others:
            partial_lease = {"tenantSurface": tenant or 0.0, "otherTenantsSurface": others or 0.0}

    stem = re.sub(r"(\.(xlsx|xlsm|pdf))+$", "", path.name, flags=re.I)
    file_number, client, address_from_name = name_from_file(stem)
    pdf = [p for p in path.parent.glob("*.pdf") if re.sub(r"(\.(xlsx|xlsm|pdf))+$", "", p.name, flags=re.I) == stem]

    return {
        "recognised": True,
        "file": str(path.relative_to(root)).replace("\\", "/"),
        "folderYear": int(re.search(r"(\d{4})", path.parent.name).group(1)),
        "hasPdf": bool(pdf),
        "pdfFile": str(pdf[0].relative_to(root)).replace("\\", "/") if pdf else None,
        "fileNumber": file_number,
        "sheetNumber": int(sheet_number) if sheet_number is not None else None,
        "client": client,
        "addressFromFileName": address_from_name,
        "address": parse_address(address_text),
        "date": prospectus_date,
        "zone": int(zone) if zone is not None else None,
        "floor": int(floor) if floor is not None else None,
        "surfaces": surfaces,
        "parameters": parameters,
        "noIndoorBathroom": no_indoor_bathroom,
        "surcharges": surcharges,
        "partialLease": partial_lease,
        "excel": {**excel_results(document, calculation, warnings), "partial": partial_excel if partial_lease else None},
        "layout": [sheet.name for sheet in sheets],
        "warnings": warnings,
    }


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    root, output = Path(sys.argv[1]), Path(sys.argv[2])
    records = []
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in (".xlsx", ".xlsm") or path.name.startswith("~$"):
            continue
        try:
            record = extract(path, root)
        except Exception as error:  # a damaged file must not stop the others
            record = {"recognised": False, "warnings": [f"Errore di lettura: {error!r}"]}
        record.setdefault("file", str(path.relative_to(root)).replace("\\", "/"))
        records.append(record)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(records, ensure_ascii=False, indent=1), encoding="utf-8")
    unrecognised = [r["file"] for r in records if not r["recognised"]]
    print(f"{len(records)} files read, {len(records) - len(unrecognised)} recognised -> {output}")
    for name in unrecognised:
        print("  not recognised:", name)


if __name__ == "__main__":
    main()
