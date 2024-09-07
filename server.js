const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

app.post('/save_scoreboard', (req, res) => {
    const newScores = req.body;
    const filePath = path.join(__dirname, 'scoreboard.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let scoreboard = [];
        if (!err) {
            scoreboard = JSON.parse(data);
        }
        scoreboard.push(newScores);
        fs.writeFile(filePath, JSON.stringify(scoreboard, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Failed to save scoreboard.');
            }
            res.status(200).send('Scoreboard updated.');
        });
    });
});


app.get('/get_scoreboard', (req, res) => {
    const filePath = path.join(__dirname, 'scoreboard.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to load scoreboard.');
        }
        res.status(200).json(JSON.parse(data));
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
