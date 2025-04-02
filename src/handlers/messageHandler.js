const { tryFormRoom } = require('../services/matchmakingService')
const { updateClient, getClient, removeClient, updatePlayerConnect } = require('../services/clientService')
const { createParty, joinParty, inviteParty, handleLeaveParty, getParty, partyMemberFindMatchUI } = require('../services/partyService')
const { clients, gameServers, waitingParties} = require('../utils/utils')
const { exec } = require('child_process')

function handleMessage(ws, message) {
    const data = JSON.parse(message)
    const clientInfo = getClient(ws)

    if (data.action === 'set_name') {
        if (!clients.has(ws) || !data.message.name) return ws.send('Client not found')
        if (clientInfo.id !== data.message.id) return ws.send('id not found')
        updateClient(ws, { name: data.message.name })
	console.log(`set_name: ${data.message.name}`)
        ws.send(JSON.stringify({ action: 'name_set', message: getClient(ws) }))
        updatePlayerConnect()
    }
    else if (data.action === 'setup_server') {
	console.log(`setup_server: ${data.message.name}`)
        let session = gameServers.find(server => {
            return server.port === data.message.name
        })
        if (!session) {
            gameServers.push({ id: clientInfo.id, port: data.message.name, status: data.message.partyId })
            console.log(`setup_serveer: status ${data.message.partyId}`)
            removeClient(ws)
        }
	else {
		console.log(`serup server fail`)
	}
        for (let session of gameServers)
            console.log(`Id: ${session.id} GameServer port: ${session.port} status: ${session.status}`)
    }
    else if (data.action === 'server_update') {
	console.log(`server_update: ${data.message.name}`)
        let session = gameServers.find(server => {
            return server.port === data.message.name
        })
        if (session) {
            session.status = data.message.partyId
            console.log(`session update port: ${session.port}, status: ${session.status}`)
        }
        else {
            console.log("session not found")
        }

        for (let session of gameServers)
            console.log(`Id: ${session.id} GameServer port: ${session.port} status: ${session.status}`)
    }
    else if (data.action === 'find_match') {
	    console.log(`find_match ${data.message.partyId}`)
        if (clientInfo.partyId && data.message.partyId) {
            const party = getParty(clientInfo.partyId)
            if (!party)
                return ws.send(JSON.stringify({ action: 'find_match_error', message: 'Party not found' }))
            if (party.host !== clientInfo.id)
                return ws.send(JSON.stringify({ action: 'find_match_error', message: 'Only the party leader can start matchmaking' })); 

            console.log(`Party Leader ${clientInfo.name} is finding match for Party ${party.id}`);
            partyMemberFindMatchUI(data.message.partyId, true)
            party.status = 'find_match'
            waitingParties.push(party)
            tryFormRoom()
        }
    }
    else if (data.action === 'create_party') {
        if (!clients.has(ws)) return ws.send('Create party fail')
        createParty(ws);
        updatePlayerConnect()
    }
    else if (data.action === 'join_party') {
        if (!data.message.partyId || !clients.has(ws)) return ws.send('Party Join fail')
        joinParty(ws, data.message.partyId)
	    updatePlayerConnect()
    }
    else if (data.action === 'invite_party') {
        if (!data.message.partyId || !clients.has(ws)) return ws.send('Party not found')

        inviteParty(ws, data.message.inviteId)
    }
    else if (data.action === 'leave_party') {
        handleLeaveParty(ws)
	    updatePlayerConnect()
    }
    else if (data.action === 'cancel_match') {
        console.log(`cancel_match ${data.message.partyId}`)
        if (clientInfo.partyId && data.message.partyId) {
            const party = getParty(clientInfo.partyId)
            party.status = ''
            const index = waitingParties.findIndex(p => p.id === clientInfo.partyId)
            if (index !== 1) {
                waitingParties.splice(index, 1)
            }
            partyMemberFindMatchUI(party.id, false)
        }
    }
}

module.exports = { handleMessage }
