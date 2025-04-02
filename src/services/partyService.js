const { generateId } = require('../utils/utils')
const { getClient, updatePlayerConnect } = require('./clientService')
const { clients, partys } = require('../utils/utils')

function createParty(ws) {
    const partyId = 'party-' + generateId()
    const client = getClient(ws)
    client.partyId = partyId

    const party = {
        id: partyId,
        host: client.id,
        status: '',
        size: 1,
        members: [client]
    };

    partys.push(party);
    console.log(`Party Created: ${partyId} by Leader ${client.name}`);
    ws.send(JSON.stringify({ action: 'party_create', message: party, status: true }))
}

function getParty(partyId) {
    return partys.find(party => party.id === partyId);
}

function joinParty(ws, partyId) {
    const party = getParty(partyId)
    if (!party) return ws.send("Party not found")

    const client = getClient(ws)
    client.partyId = partyId
    party.size += 1
    party.members.push(client)

    ws.send("Joined Party successfully")
    console.log(`party -> ${party.size}`)
    // Broadcast to party members
    updatePartyMemberByID(partyId)
}

function inviteParty(ws, inviteId) {
    console.log('Debug inviteParty')
    let inviteTarget = null;
    const client = getClient(ws)
    let messageError

    for (const [ws, clientInfo] of clients.entries()) {
        if (clientInfo.id === inviteId) {
            let party = getParty(clientInfo.partyId)
            if (party.status === 'find_match') {
                console.log(`party status -> ${party.status}`)
                messageError = 'Player is finding a match'
                break
            }
            if (party && party.members.length >= 2) {
                console.log(`Client with ID ${inviteId} already has party (Party ID: ${clientInfo.partyId})`)
                messageError = 'Player already has party'
                break
            }
            console.log('inviteParty -> has no party')
            inviteTarget = ws
            break
        }
    }

    if (inviteTarget) {
        inviteTarget.send(JSON.stringify({ action: "party_invite_sucess", message: {id: client.id, name: client.name, partyId: client.partyId}}))
    } else {
        ws.send(JSON.stringify({ action: "party_invite_failed", message: messageError }))
    }
}

function updatePartyMemberByID(partyId) {
    const party = partys.find(party => party.id === partyId)

    if (party) {
        party.members.forEach(member => {
            const ws = [...clients.entries()].find(([key, value]) => value.id === member.id)[0]
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ action: "party_join", message: party }))
            }
        });
    }
}

function partyMemberFindMatchUI(partyId, status) {
    const party = partys.find(party => party.id === partyId)

    if (party) {
        console.log(`partyMemberFindMatchUI -> ${partyId} status ${status}`)
        party.members.forEach(member => {
            const ws = [...clients.entries()].find(([key, value]) => value.id === member.id)[0]
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ action: "match_update_ui", message: { status: status }}))
            }
        });
    }
}

function handleLeaveParty(ws) {
    const clientInfo = clients.get(ws)
    if (!clientInfo.partyId) return

    const partyIndex = partys.findIndex(p => p.id === clientInfo.partyId)
    if (partyIndex === -1) return

    const party = partys[partyIndex]
    if (party.host === clientInfo.id) {
        partys.splice(partyIndex, 1)
        party.members.forEach(member => {
            const ws = [...clients.entries()].find(([key, value]) => value.id === member.id)[0]
            const clearedMember = { ...clients.get(ws), partyId: '' };
            clients.set(ws, clearedMember)
            if (ws && party.members.length > 1) {
                ws.send(JSON.stringify({ action: 'party_disbanded', message: 'Party has been disbanded by leader' }))
            } else {
                console.log("disbanded")
                updatePlayerConnect()
            }
        })
    } else {
        party.members = party.members.filter(m => m.id !== clientInfo.id)
        party.size -= 1
        const clearedMember = { ...clientInfo, partyId: ''}
        clients.set(ws, clearedMember)
        console.log(`Leave Party Debug -> Member size = ${party.size} Member Length = ${party.members.length}`)
        updatePartyMemberByID(party.id)
    } 
}

module.exports = { createParty, getParty, joinParty, inviteParty, handleLeaveParty, updatePartyMemberByID, partyMemberFindMatchUI }
