const http = require('http');
const faye = require('faye');

const mountPath = '/faye';
const port = 8000;

const server = http.createServer();
const bayeux = new faye.NodeAdapter({ mount: mountPath, timeout: 45 });

bayeux.attach(server);
server.listen(port, () => {
  console.log(
    `listening on http://localhost:${port}${mountPath}\n========================================`,
  );
});

bayeux.on('handshake', clientId =>
  console.log('^^ client connect (#', clientId.substring(0, 4), ')'),
);

bayeux.on('disconnect', clientId =>
  console.log('vv client disconnect (#', clientId.substring(0, 4), ')'),
);

bayeux.on('publish', (clientId, channel, data) => {
  console.log(
    `<== New message from ${clientId.substring(0, 4)} on channel ${channel}`,
    `\n    ** Payload: ${JSON.stringify(data)}`,
  );
});

bayeux.on('subscribe', (clientId, channel) => {
  console.log(
    `++ New subscription from ${clientId.substring(0, 4)} on ${JSON.stringify(
      channel,
    )}`,
  );
});

bayeux.on('unsubscribe', (clientId, channel) => {
  console.log(
    `-- Unsubscribe by ${clientId.substring(0, 4)} on ${JSON.stringify(
      channel,
    )}`,
  );
});
