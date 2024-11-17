const LARGE_GAMES = new Set([
  'fridaynightfunkin',
  'btd6',
  'v86',
  'amazing-rope-police',
  'drifthunters',
  'adventure-capitalist',
  'pokemon',
  'crimsonfantasia',
  'webretro',
  'fnaf4',
  'russiancardriver',
  'funnyshooter2',
  'osumania',
  'idleresearch',
  'ducklife6',
  'rocketleague',
  'turboracing3',
  'osu',
  'championisland',
  'townscaper',
  'gdlite',
  'fnfmidfight',
  'fnaf',
  'fnaf2',
  'flappyrace',
  'madalincars',
  '10minutestilldawn',
  'gladihoppers',
  'burgerandfrights',
  'funnymadracing',
  'superhot',
  'pizzatower',
  'boxingphysics2',
  'houseofhazards',
  'papermario',
  'karlson',
  'roughdino',
  'geodashsky',
  'baldis-basics',
  'templerun2',
  'fleeingthecomplex',
  'marioparty3',
  'donkeykong64',
  'mariopartyds',
  'animalcrossingwildworld',
  'nintendogs',
  'marioparty2',
  'mariokartds',
  'majorasmask',
  'marioparty',
  'burritobison',
  'ocarinaoftime',
  'cluster-rush',
  'fnaf3',
  'minion',
  'vex7',
  'thirtydollarwebsite',
  'infiltratingtheairship',
  'ducklife3',
  'rooftopsnipers2'
]);

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if this is a request for a game file cause im a idiot. Like how did I not think of this.
  if (path.startsWith('/semag/')) {
    // Extract the game directory name and the rest of the path
    const pathParts = path.split('/');
    const gameDir = pathParts[2];
    // Remove 'semag' from path and join the rest
    const r2Path = pathParts.slice(2).join('/');

    if (LARGE_GAMES.has(gameDir)) {
      try {
        if (!env.GAMES) {
          return new Response('R2 bucket not configured', { status: 500 });
        }

        // Now fetching from root of R2 bucket without 'semag'
        const obj = await env.GAMES.get(r2Path);

        if (!obj) {
          return new Response(`File not found in R2: ${r2Path}`, { status: 404 });
        }

        const contentType = obj.httpMetadata?.contentType || getContentType(path);
        return new Response(obj.body, {
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=31536000',
            'access-control-allow-origin': '*'
          }
        });
      } catch (error) {
        return new Response(`R2 error: ${error.message}`, { status: 500 });
      }
    }
  }

  return next();
}


function getContentType(path) {
  const extension = path.split('.').pop().toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'webp': 'image/webp',
    'wasm': 'application/wasm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'data': 'application/octet-stream',
    'bin': 'application/octet-stream'
  };
  
  return types[extension] || 'application/octet-stream';
}