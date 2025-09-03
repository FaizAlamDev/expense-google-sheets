require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeAuth } = require("./utils/auth");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/", routes);

initializeAuth()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Fatal auth initialization error:", err);
    process.exit(1);
  });
