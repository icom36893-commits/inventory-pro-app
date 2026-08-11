import http from 'http';
import { ipcHandlers } from './main';
import localtunnel from 'localtunnel';

let server: http.Server | null = null;
let activeTunnel: localtunnel.Tunnel | null = null;

export async function startCloudTunnel(port: number): Promise<string> {
  if (activeTunnel) {
    activeTunnel.close();
  }
  
  activeTunnel = await localtunnel({ port });
  
  activeTunnel.on('close', () => {
    activeTunnel = null;
  });
  
  return activeTunnel.url;
}

export function stopCloudTunnel() {
  if (activeTunnel) {
    activeTunnel.close();
    activeTunnel = null;
  }
}

export function startApiServer(port: number) {
  if (server) return;
  
  server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/ipc') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { channel, args } = JSON.parse(body);
          const handler = ipcHandlers.get(channel);
          
          if (handler) {
            // Mock the event object
            const event = { sender: { send: () => {} } };
            const result = await handler(event, ...(args || []));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data: result }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Channel not found' }));
          }
        } catch (error: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Api server listening on port ${port}`);
  });
}

export function stopApiServer() {
  if (server) {
    server.close();
    server = null;
  }
}
