// const express = require('express');
// const bodyParser = require('body-parser');
// const { exec } = require('child_process');

// const app = express();
// app.use(bodyParser.json());

// app.post('/runScript', (req, res) => {
//     exec('./run.sh', (error, stdout, stderr) => {
//         if (error) {
//             console.log(`error: ${error.message}`);
//             return res.status(500).send({ error: error.message });
//         }
//         if (stderr) {
//             console.log(`stderr: ${stderr}`);
//             return res.status(500).send({ error: stderr });
//         }
//         console.log(`stdout: ${stdout}`);
//         return res.send({ message: stdout });
//     });
// });

// app.listen(3001, () => console.log('Server is running on port 3001'));

const express = require("express");
const { spawn } = require("child_process");

const app = express();

app.get("/runScript", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");

  const scriptExecution = spawn("./run.sh");

  scriptExecution.stdout.on("data", (data) => {
    const output = data.toString().trim();
    res.write(`data: ${output}\n\n`);
  });

  scriptExecution.stderr.on("data", (data) => {
    const error = data.toString().trim();
    res.write(`data: Error: ${error}\n\n`);
  });

  scriptExecution.on("close", (code) => {
    if (code === 0) {
      res.write("data: Script execution completed successfully\n\n");
    } else {
      res.write(`data: Script execution failed with exit code ${code}\n\n`);
    }
    res.end();
  });
});

app.listen(3001, () => console.log("Server is running on port 3001"));
