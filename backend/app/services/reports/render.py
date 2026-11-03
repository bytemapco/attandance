"""Writes an ExportTable as an Excel workbook or a PDF."""
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.services.reports.tables import ExportTable

XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PDF_TYPE = "application/pdf"
MAX_COLUMN_WIDTH = 28


def to_xlsx(table: ExportTable) -> bytes:
    book = Workbook()
    sheet = book.active
    sheet.title = table.title
    for line in table.heading:
        sheet.append([line])
    sheet["A1"].font = Font(bold=True, size=13)
    sheet.append([])
    sheet.append(table.columns)
    for cell in sheet[sheet.max_row]:
        cell.font = Font(bold=True)
    for row in table.rows:
        sheet.append(row)
        for cell in sheet[sheet.max_row]:
            if isinstance(cell.value, str) and cell.value.startswith("="):
                cell.data_type = "s"  # a student name must never run as a formula
    for index, column in enumerate(table.columns, start=1):
        longest = max([len(column), *[len(str(row[index - 1] or "")) for row in table.rows]])
        sheet.column_dimensions[sheet.cell(row=1, column=index).column_letter].width = min(longest + 2, MAX_COLUMN_WIDTH)
    sheet.freeze_panes = sheet.cell(row=len(table.heading) + 3, column=1)
    out = BytesIO()
    book.save(out)
    return out.getvalue()


def to_pdf(table: ExportTable) -> bytes:
    out = BytesIO()
    document = SimpleDocTemplate(out, pagesize=landscape(A4), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()
    story = [Paragraph(table.heading[0], styles["Title"])]
    story += [Paragraph(line, styles["Normal"]) for line in table.heading[1:]]
    story.append(Spacer(1, 10))
    data = [table.columns, *[["" if cell is None else cell for cell in row] for row in table.rows]]
    font_size = 8 if len(table.columns) <= 14 else 6
    grid = Table(data, repeatRows=1)
    grid.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), font_size),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94A3B8")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(grid)
    document.build(story)
    return out.getvalue()
