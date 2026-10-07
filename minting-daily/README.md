# Minting Daily Production

Source for the Emirates Gold "Minting Daily Production" dashboard (a published Claude artifact).

- `dashboard.html` – the page. Reads the `entries` collection from the artifact's shared db; read-only for viewers.
  Publish with capabilities `{"db":{"rules":[{"path":"","read":"view","write":"owner"}]}}`.
- `prep_entries.py` – converts the Excel workbook into db documents (`python3 prep_entries.py <workbook.xlsm> [out.json]`),
  normalising client names to Title Case and building ids like `xl-YYYYMMDD-client-slug-metal-pcs-n`.

The workbook and generated JSON are not committed (client data).
