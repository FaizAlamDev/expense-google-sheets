const { google } = require("googleapis");
const oauth2Client = require("../config/oauth");
const { MAX_DAILY_EXPENSES, TOTAL_COLUMN } = require("../config/sheetConfig");
const { findRowByDate } = require("./findRowByDate");
const { getAvailableSlots } = require("./getAvailableSlots");
const db = require("./db");
const logger = require("./logger");

const pendingByDate = new Map();

function enqueue(date, task) {
  const prev = pendingByDate.get(date) ?? Promise.resolve();
  const run = prev.catch(() => {}).then(task);
  pendingByDate.set(date, run);
  const done = () => {
    if (pendingByDate.get(date) === run) pendingByDate.delete(date);
  };
  run.then(done, done);
  return run;
}

function createTotalFormula(row) {
  return (
    `=SUMPRODUCT(ARRAYFORMULA(` +
    `IFERROR(REGEXEXTRACT(B${row}:K${row}, ":\\s(\\d+\\.?\\d*)")*1, 0)` +
    `))`
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function monthOf(dateStr) {
  return dateStr ? String(dateStr).slice(0, 7) : "";
}

async function getSheetLayout(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1!A:K",
  });

  const values = response.data.values || [];
  let lastContentRow = 0;
  const dayRows = [];
  const totalRows = [];

  values.forEach((rowVals, i) => {
    const row = i + 1;
    const a = String(rowVals[0] ?? "").trim();
    const k = String(rowVals[10] ?? "").trim();
    if (!a && !k) return;
    if (row > lastContentRow) lastContentRow = row;
    if (DATE_RE.test(a)) {
      dayRows.push({ row, date: a });
    } else if (k.toUpperCase() === "TOTAL") {
      totalRows.push(row);
    }
  });

  return { lastContentRow, dayRows, totalRows };
}

function dayRowsForMonth(dayRows, month) {
  return dayRows.filter((r) => monthOf(r.date) === month);
}

async function formatTotalRow(sheets, totalRow) {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.SHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: totalRow - 1,
                endRowIndex: totalRow,
                startColumnIndex: 10,
                endColumnIndex: 12,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 1, green: 0.94, blue: 0.6 },
                },
              },
              fields:
                "userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor",
            },
          },
        ],
      },
    });
    logger.info(`Formatted Total row ${totalRow} on Google Sheets (bold + highlight)`);
  } catch (err) {
    logger.warn(`Failed to format Total row ${totalRow} on Google Sheets: ${err.message}`);
  }
}

async function writeMonthTotalRow(sheets, month, totalRow, dayRows) {
  const firstDay = dayRows.length ? dayRows[0].row : 0;
  const lastDay = dayRows.length ? dayRows[dayRows.length - 1].row : 0;
  const adjustments = await db.getAdjustmentsByMonth(month);
  const net = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const mValue = net === 0 ? "" : String(net);

  const formula =
    dayRows.length > 0
      ? `=SUM(L${firstDay}:L${lastDay})+M${totalRow}`
      : `=M${totalRow}`;

  const rowData = new Array(13).fill("");
  rowData[0] = ".";
  rowData[10] = "Total";
  rowData[11] = formula;
  rowData[12] = mValue;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `Sheet1!A${totalRow}:M${totalRow}`,
    valueInputOption: "USER_ENTERED",
    resource: { values: [rowData] },
  });

  logger.info(
    `Finalized month ${month} total on Google Sheets at row ${totalRow} (net adjustments: ${mValue || 0})`
  );

  await formatTotalRow(sheets, totalRow);
}

async function finalizePendingMonths(sheets, layout, fromMonth, toMonth) {
  let totalRow = 0;
  let prevTotalRow = 0;

  let year = Number(fromMonth.slice(0, 4));
  let month = Number(fromMonth.slice(5, 7));
  const endYear = Number(toMonth.slice(0, 4));
  const endMonth = Number(toMonth.slice(5, 7));

  let iterations = 0;
  while (year < endYear || (year === endYear && month < endMonth)) {
    if (++iterations > 36) {
      logger.error(
        "Aborting month finalization: too many months between sheet state and new date."
      );
      break;
    }

    const mm = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    const dayRows = dayRowsForMonth(layout.dayRows, mm);

    if (dayRows.length > 0) {
      totalRow = dayRows[dayRows.length - 1].row + 1;
    } else {
      totalRow = prevTotalRow ? prevTotalRow + 3 : layout.lastContentRow + 1;
    }

    if (!layout.totalRows.includes(totalRow)) {
      await writeMonthTotalRow(sheets, mm, totalRow, dayRows);
    }
    prevTotalRow = totalRow;

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return prevTotalRow;
}

async function computeAppendRow(sheets, layout, date) {
  if (layout.dayRows.length === 0) {
    return layout.lastContentRow + 1;
  }

  const lastDayRow = layout.dayRows[layout.dayRows.length - 1];
  const newMonth = monthOf(date);

  if (monthOf(lastDayRow.date) === newMonth) {
    return layout.lastContentRow + 1;
  }

  const fromMonth = monthOf(lastDayRow.date);
  const totalRow = await finalizePendingMonths(sheets, layout, fromMonth, newMonth);
  return Math.max(totalRow + 3, layout.lastContentRow + 1);
}

async function syncMonthTotalToGoogleSheets(month) {
  if (!oauth2Client.credentials) {
    logger.warn("Google Sheets sync skipped: OAuth not authenticated.");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const layout = await getSheetLayout(sheets);

    const lastDayRows = layout.dayRows.filter((r) => monthOf(r.date) === month);
    if (lastDayRows.length === 0) {
      logger.info(`No day rows on sheet for month ${month}; skipping adjustment sync.`);
      return;
    }

    const totalRow = lastDayRows[lastDayRows.length - 1].row + 1;
    if (!layout.totalRows.includes(totalRow)) {
      logger.info(`No finalized Total row on sheet for month ${month}; skipping adjustment sync.`);
      return;
    }

    const adjustments = await db.getAdjustmentsByMonth(month);
    const net = adjustments.reduce((sum, a) => sum + a.amount, 0);
    const mValue = net === 0 ? "" : String(net);

    const cell = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `Sheet1!M${totalRow}`,
    });
    const currentStr = String(cell.data.values?.[0]?.[0] ?? "").trim();
    const currentNum = Number(currentStr);
    const currentIsZero = currentStr === "" || (Number.isFinite(currentNum) && currentNum === 0);

    let target = null;
    if (mValue === "") {
      if (!currentIsZero) target = "";
    } else if (currentStr !== mValue) {
      target = mValue;
    }

    if (target === null) return;

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `Sheet1!M${totalRow}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: [[target]] },
    });

    logger.info(`Synchronized adjustments (${mValue || 0}) to Total row ${totalRow} for month ${month}.`);
  } catch (err) {
    logger.error(`Google Sheets adjustment sync failed for month ${month}: ${err.message}`);
  }
}

async function doSyncToGoogleSheets(date, newExpenses) {
  if (!oauth2Client.credentials) {
    logger.warn("Google Sheets sync skipped: OAuth not authenticated.");
    return;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    let { row } = await findRowByDate(sheets, date);

    if (row > 0) {
      let { availableSlots, nextExpenseCol } = await getAvailableSlots(sheets, date);

      if (newExpenses.length > availableSlots) {
        logger.warn(`Google Sheets has only ${availableSlots} slots left for ${date}, but trying to write ${newExpenses.length}`);
      }

      const writeCount = Math.min(newExpenses.length, availableSlots);
      if (writeCount === 0) return;

      const updates = newExpenses.slice(0, writeCount).map((expense, i) => ({
        range: `Sheet1!${String.fromCharCode(65 + nextExpenseCol + i)}${row}`,
        values: [[`${expense.name}: ${expense.amount}`]],
      }));

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.SHEET_ID,
        resource: {
          valueInputOption: "USER_ENTERED",
          data: updates,
        },
      });
    } else {
      const layout = await getSheetLayout(sheets);
      row = await computeAppendRow(sheets, layout, date);

      const rowData = new Array(MAX_DAILY_EXPENSES + 2).fill("");
      rowData[0] = date;

      const writeCount = Math.min(newExpenses.length, MAX_DAILY_EXPENSES);
      newExpenses.slice(0, writeCount).forEach((expense, i) => {
        rowData[i + 1] = `${expense.name}: ${expense.amount}`;
      });

      rowData[MAX_DAILY_EXPENSES + 1] = createTotalFormula(row);

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!A${row}:${TOTAL_COLUMN}${row}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [rowData] },
      });
    }
    logger.info(`Successfully synchronized ${newExpenses.length} expenses to Google Sheets for date: ${date}`);
  } catch (err) {
    logger.error(`Google Sheets synchronization failed for date ${date}: ${err.message}`);
  }
}

async function doSyncDateGroupToGoogleSheets(date) {
  if (!oauth2Client.credentials) {
    logger.warn("Google Sheets sync skipped: OAuth not authenticated.");
    return;
  }

  try {
    const expenses = await db.getExpensesByDate(date);
    const slots = new Array(MAX_DAILY_EXPENSES).fill("");
    expenses.slice(0, MAX_DAILY_EXPENSES).forEach((expense, i) => {
      slots[i] = `${expense.name}: ${expense.amount}`;
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const { row } = await findRowByDate(sheets, date);

    if (row > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!B${row}:K${row}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [slots] },
      });
    } else {
      const layout = await getSheetLayout(sheets);
      const newRow = await computeAppendRow(sheets, layout, date);
      const rowData = [date, ...slots, createTotalFormula(newRow)];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Sheet1!A${newRow}:${TOTAL_COLUMN}${newRow}`,
        valueInputOption: "USER_ENTERED",
        resource: { values: [rowData] },
      });
    }

    logger.info(`Successfully synchronized ${expenses.length} expenses to Google Sheets for date: ${date}`);
  } catch (err) {
    logger.error(`Google Sheets synchronization failed for date ${date}: ${err.message}`);
  }
}

async function syncToGoogleSheets(date, newExpenses) {
  await enqueue(date, () => doSyncToGoogleSheets(date, newExpenses));
}

async function syncDateGroupToGoogleSheets(date) {
  await enqueue(date, () => doSyncDateGroupToGoogleSheets(date));
}

module.exports = { syncToGoogleSheets, syncDateGroupToGoogleSheets, syncMonthTotalToGoogleSheets };