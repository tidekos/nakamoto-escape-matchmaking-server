const { handleMessage } = require('./messageHandler')
const { handleClose } = require('./closeHandler')
const { addClient, updatePlayerConnect } = require('../services/clientService')

function handleConnection(ws) {
    const clientInfo = addClient(ws)
    console.log(`New connection assigned id: ${clientInfo.id}, Name: ${clientInfo.name}`)

    ws.on('message', (message) => handleMessage(ws, message))
    ws.on('close', () => handleClose(ws));

    ws.send(JSON.stringify({ action: 'client_set', message: clientInfo }))
    updatePlayerConnect();
}

module.exports = { handleConnection }
