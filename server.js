const WebSocket = require('ws');
const { handleConnection } = require('./src/handlers/connectionHandler');
const { port } = require('./src/utils/config')

const server = new WebSocket.Server({ port: port });

server.on('connection', handleConnection);

console.log('WebSocket server is running');
