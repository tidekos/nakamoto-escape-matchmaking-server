let partys = []; // เก็บข้อมูล Party ทั้งหมด
const clients = new Map(); // เก็บข้อมูล Client ที่เชื่อมต่อ
const MAX_GAMEROOM_MEMBERS = 3;

/*
    { port: "9000", status: "ready", server: {}}
    { port: "9001", status: "ready", server: {}}
    { port: "9002", status: "ready", server: {}}
 */
let gameServers = [] 
const waitingParties = []; 
const rooms = []; 

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

module.exports = {
    partys,
    clients,
    MAX_GAMEROOM_MEMBERS,
    gameServers,
    waitingParties,
    rooms,
    generateId
}
