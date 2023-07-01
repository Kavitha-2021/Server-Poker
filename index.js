const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  allowEIO3: true,
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.5.20:3000'],
    methods: ["GET", "POST"],
    allowedHeaders: ["myheader"],
    credentials: true,
  },
  transports: ['websocket']
});

const Route = require('./router/routeplayer');

require('dotenv').config();

const PORT = process.env.PORT || 6061;

app.use(express.json());
app.use(Route);

server.listen(PORT, () => {
  console.log(`Server is running on localhost:${PORT}`);
  console.log(`http://localhost:${PORT}`)
});

require('./socket')(io);

module.exports = io;



// const express = require('express')
// const app = express();
// const http = require('http')
// const { Server } = require('socket.io')
// const cors = require('cors')
// const csrfProtection = require('csrf')

// const trustedOrigins = ['http://localhost:3000', 'http://192.168.5.20:3000'];


// app.use(cors());

// app.use((req, res, next) => {
//   if (trustedOrigins.includes(req.headers.origin)) {
//     csrfProtection(req, res, next);
//   } else {
//     next();
//   }
// });

// const server = http.createServer(app);

// const io = new Server(server, {
//   allowEIO3: true,
//   cors: {
//     origin: ['http://localhost:3000', 'http://192.168.5.20:3000'],
//     methods: ["GET", "POST"],
//     allowedHeaders: ["myheader"],
//     credentials: true
//   },
//   transports: ['websocket']
// });
// const Route = require('./router/routeplayer')

// require('dotenv').config()

// const PORT = process.env.PORT || 6061

// app.use(express.json())
// app.use(Route);

// server.listen(PORT ,()=> {
//     console.log(`Server is running on localhost ${PORT}`)
//     console.log(`http://localhost:${PORT}`)
// })

// require('./socket')(io)

// module.exports = io