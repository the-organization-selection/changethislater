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
  
  // Debug log the request
  console.log('Request URL:', url.toString());
  console.log('Request path:', path);

  // Check if this is a request for a game file
  if (path.startsWith('/semag/')) {
    // Extract the game directory name
    const gameDir = path.split('/')[2];
    console.log('Game directory:', gameDir);
    console.log('Is large game:', LARGE_GAMES.has(gameDir));

    // If this is a large game, serve from R2
    if (LARGE_GAMES.has(gameDir)) {
      try {
        // Remove leading slash for R2 key
        const r2Key = path.substring(1);
        console.log('Fetching from R2:', r2Key);

        // Check if the bucket exists
        if (!env.GAMES) {
          console.error('R2 bucket not found in environment');
          return next(); // Fall back to Pages if bucket isn't configured
        }

        const obj = await env.GAMES.get(r2Key);
        console.log('R2 response:', obj ? 'Found' : 'Not found');

        if (obj === null) {
          console.log('File not found in R2:', r2Key);
          return next(); // Try serving from Pages if not in R2
        }

        // Get content type from object metadata or infer from extension
        const contentType = obj.httpMetadata?.contentType || getContentType(path);
        console.log('Serving with content-type:', contentType);

        // Return the file from R2 with proper headers
        return new Response(obj.body, {
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=31536000',
            'access-control-allow-origin': '*',
            'x-served-from': 'r2' // Debug header to confirm source
          }
        });
      } catch (error) {
        console.error('R2 fetch error:', error);
        // Fall back to Pages on error
        return next();
      }
    } else {
      console.log('Serving from Pages:', gameDir);
    }
  }

  // If not a large game or not a game request, let Pages handle it
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