const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

app.post('/runScript', (req, res) => {
    exec('./run.sh', (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return res.status(500).send({ error: error.message });
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return res.status(500).send({ error: stderr });
        }
        console.log(`stdout: ${stdout}`);
        return res.send({ message: stdout });
    });
});

app.listen(3001, () => console.log('Server is running on port 3001'));
