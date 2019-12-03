const webSocket = require('websocket').server;
const http = require('http');
const express = require('express');
const app = express();

const server = http.createServer((request,response)=>{
    console.log("Server started");
});
const port = process.env.PORT || 1447;
server.listen(port,function(){
    console.log(`Listening to port ${port}`);
});

let users = [];

const online = (res)=>{
    res.write(JSON.stringify(users));
}

const wsServer = new webSocket({
    httpServer: server
});

let connection = {};
wsServer.on('request',(request)=>{
    console.log('incoming request from '+request.origin);
    const user = request.resourceURL.query;
    console.log(`Connected User ${user.from}`);
    connection[user.from] = request.accept(null,request.origin);
    users.push(user.from);
    console.log(`Users Online ${JSON.stringify(users)}`);
    for(let u in connection){
        connection[u].sendUTF(JSON.stringify({existing:users}));
    }  
    connection[user.from].on('close',(a)=>{
        console.log(`Connection with ${user.from} closed`);
        users = users.filter(e=>(e!=user.from));
        users.forEach(e=>{
            connection[e].sendUTF(JSON.stringify({existing:users}));
        });
        connection[user.from].close();
        delete connection[user.from];
        console.log(`Users Online :`);
        for(let c in connection){
            console.log(c);
        }
    });
    connection[user.from].on('message',(message)=>{
        if(message && message.type === 'utf8'){
            const incoming = JSON.parse(message.utf8Data);
            console.log(`Received message from ${incoming.from} msg ${incoming.message} for ${incoming.to}`);
            if(connection[incoming.to]){
                connection[incoming.to].sendUTF(JSON.stringify(incoming));
            }else{
                console.log(`Unable to send message to ${incoming.to}`);
                connection[incoming.from].sendUTF(JSON.stringify(
                    {
                        from:incoming.from,
                        to:incoming.to,
                        error:`${incoming.to} is not connected`}
                    ));
            }
        }
    });
});