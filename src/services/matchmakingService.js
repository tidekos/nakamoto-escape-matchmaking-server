const { gameServers, clients, MAX_GAMEROOM_MEMBERS, waitingParties, rooms } = require('../utils/utils')

//const { exec } = require('child_process')

function createServer(port) {
	exec(`sh ${scriptPath} -port=${port} -log`)
}

function tryFormRoom() {
    const availableParties = [...waitingParties];
  
    function tryCombo(currentParties = [], total = 0, usedPartyIds = new Set()) {
        if (total === MAX_GAMEROOM_MEMBERS) return currentParties;
    
        for (let i = 0; i < availableParties.length; i++) {
            const p = availableParties[i];
    
            if (usedPartyIds.has(p.id)) continue; // ❌ ข้ามถ้าเคยใช้แล้ว
            if (total + p.size > MAX_GAMEROOM_MEMBERS) continue;
    
            const newSet = new Set(usedPartyIds);
            newSet.add(p.id);
    
            const result = tryCombo([...currentParties, p], total + p.size, newSet);
            if (result) return result;
        }
    
        console.log('tryCombo -> null')
        return null;
    }
  
    const group = tryCombo();
  
    if (group) {
        const members = group.flatMap(p => p.members);
        const roomId = '1234';
  
        rooms.push({
            id: roomId,
            members
        });
  
        group.forEach(p => {
            const index = waitingParties.findIndex(x => x.id === p.id);
            if (index !== -1) waitingParties.splice(index, 1);
        });

        let session = gameServers.find(server => server.status === 'ready')
        if (session) {
            session.status = 'played'

            members.forEach(member => {
                console.log(`party member -> id = ${member.id}, name = ${member.name}, party ID = ${member.partyId}`)
                const ws = [...clients.entries()].find(([key, value]) => value.id === member.id)[0]
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        //type: 'match_found',
                        //roomId,
                        //members: members.map(m => m.id),
                        action: 'match_found',
                        matchId: session.port
                    }));
                }
            });
        }  
        console.log(`✅ Room ${roomId} formed with players: ${members.map(m => m.id).join(', ')}`);
    }
}

module.exports = { processMatchmaking, createServer, privateSession, handleMatchMaking, tryFormRoom }
