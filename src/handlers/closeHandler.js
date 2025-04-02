const { removeClient, updatePlayerConnect } = require('../services/clientService')
const { handleLeaveParty } = require('../services/partyService')

function handleClose(ws) {
    handleLeaveParty(ws)
    removeClient(ws);
    console.log(`Connection closed`)
    updatePlayerConnect()
}

module.exports = { handleClose }
