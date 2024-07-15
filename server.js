const httpServer = require('http-server');
const path = require('path');

const server = httpServer.createServer({ root: path.join(__dirname) });
const port = 8080;

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
