const findRowByDate = async (sheets, date) => {
  const dateResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1!A:A",
  });

  const dates = dateResponse.data.values || [];
  let row = -1;

  for (let i = 0; i < dates.length; i++) {
    if (dates[i][0]?.toLowerCase() === date.toLowerCase()) {
      row = i + 1;
      break;
    }
  }

  return { row, dates };
};

exports.findRowByDate = findRowByDate;
