const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/runScript", (req, res) => {
  let { origin, operator, first, second } = req.body;

  const command = `./run.sh ${origin} ${operator} ${first} ${second}`;

  const childProcess = spawn(command, { shell: true });

  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    res.write(data);
  });

  childProcess.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
    res.write(data);
  });

  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    res.end();
  });
});

app.listen(3001, () => console.log("Server is running on port 3001"));
