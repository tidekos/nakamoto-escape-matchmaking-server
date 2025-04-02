const { generateId } = require('../utils/utils')
const { clients } = require('../utils/utils')

function addClient(ws) {
    const clientInfo = {
        id: generateId(),
        name: 'Player-' + generateId(),
        status: false,
        partyId: ''
    };
    clients.set(ws, clientInfo)
    return clientInfo
}

function getClient(ws) {
    return clients.get(ws)
}

function updateClient(ws, updateData) {
    const client = clients.get(ws) || {}
    clients.set(ws, { ...client, ...updateData })
}

function removeClient(ws) {
    clients.delete(ws)
}

function updatePlayerConnect() {
    const clientList = []
    clients.forEach((clientInfo) => {
        clientList.push(clientInfo)
    })

    clients.forEach((clientInfo, ws) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ action: "clients_update", message: clientList }))
        }
    })
}

module.exports = { addClient, getClient, updateClient, removeClient, updatePlayerConnect }
