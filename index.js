const express = require('express');
const request = require('request');
const Unblocker = require('unblocker');
const helmet = require("helmet");
const morgan = require ("morgan");
const compression = require ("compression");
const zlib = require ("zlib")

const app = express();

app.use(morgan('dev'))
app.use(compression())

const unblocker = new Unblocker({ prefix: '/go/' });

app.set('port', process.env.PORT || 3000);

app.use(express.static('public'));
app.use(unblocker);
app.use(helmet());
app.get('/go/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url);
  request.get(url).pipe(res);
});

app.get('/go', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing URL parameter');
  }
  const proxyUrl = `/go/${encodeURIComponent(url)}`;
  res.redirect(proxyUrl);
});

app.listen(app.get('port'), () => {
  console.log(`Server running on port ${app.get('port')}`);
});
