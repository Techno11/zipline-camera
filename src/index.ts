import {drive, pan, stopServos, tilt} from "./servoControl";
import * as http from 'http';
import {Socket, Server as SocketServer} from 'socket.io';
import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';

// Setup dotenv
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use('/scripts', express.static(path.resolve(__dirname, '../', 'public', 'scripts')));
app.get('*', (request, response) => {
  response.sendFile(path.resolve(__dirname, '../', 'public', 'index.html'));
});
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['authorization'],
    credentials: true
  }
});

const port = process.env.PORT ?? '1322'

const currentPositions = {pan: 90, tilt: 90, drive: 0};
const lastPositions = {pan: 90, tilt: 90, drive: 0};

// Update positions every 50 ms
setInterval(() => {
  if(currentPositions.pan !== lastPositions.pan) {
    pan(currentPositions.pan);
    lastPositions.pan = currentPositions.pan;
  }
  if(currentPositions.tilt !== lastPositions.tilt) {
    tilt(currentPositions.tilt);
    lastPositions.tilt = currentPositions.tilt;
  }
  if(currentPositions.drive !== lastPositions.drive) {
    drive(currentPositions.drive);
    lastPositions.drive = currentPositions.drive;
  }
}, 25)

// Setup Socket Connector
io.on('connection', async (client: Socket) => {

  client.on('disconnect', () => {
    client.disconnect();
  });

  client.on('drip', () => {
    client.emit('drop');
  });

  // X = Drive, Y = None
  client.on('left-stick', (data) => {
    data = JSON.parse(data);
    currentPositions.drive = data.x;
  })

  // X = Pan, Y = Tilt
  client.on('right-stick', (data) => {
    data = JSON.parse(data);
    currentPositions.pan += data.x;
    currentPositions.tilt += data.y;
    if(currentPositions.pan > 180) currentPositions.pan = 180;
    if(currentPositions.tilt > 180) currentPositions.pan = 180;
    if(currentPositions.pan < 0) currentPositions.pan = 0;
    if(currentPositions.tilt < 0) currentPositions.pan = 0;
  })
});

server.listen(port)
server.on('listening', () => {
  console.log(`✔ Server Listening on port ${port}`)
})

process.on("SIGINT", () => {
  stopServos().then(() => process.exit(0));
})