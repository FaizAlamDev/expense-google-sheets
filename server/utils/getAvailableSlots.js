const { MAX_DAILY_EXPENSES, TOTAL_COLUMN } = require("../config/sheetConfig");
const { findRowByDate } = require("./findRowByDate");

const getAvailableSlots = async (sheets, date) => {
  const { row } = await findRowByDate(sheets, date);

  const rowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `Sheet1!A${row}:${TOTAL_COLUMN}${row}`,
  });

  const existingData = rowResponse.data.values[0] || [];

  let nextExpenseCol = 1;
  while (nextExpenseCol <= MAX_DAILY_EXPENSES && existingData[nextExpenseCol]) {
    nextExpenseCol++;
  }

  let availableSlots = MAX_DAILY_EXPENSES - (nextExpenseCol - 1);

  return { availableSlots, nextExpenseCol };
};

exports.getAvailableSlots = getAvailableSlots;
