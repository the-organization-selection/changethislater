// functions/_middleware.js
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

  // Add debug logging
  console.log(`Processing request for: ${path}`);

  // Check if this is a request for a game file
  if (path.startsWith('/semag/')) {
    // Extract the game directory name
    const gameDir = path.split('/')[2];
    
    console.log(`Game directory: ${gameDir}`);
    console.log(`Is large game: ${LARGE_GAMES.has(gameDir)}`);

    // If this is a large game, serve from R2
    if (LARGE_GAMES.has(gameDir)) {
      try {
        // Remove leading slash for R2 key
        const r2Key = path.substring(1);
        console.log(`Fetching from R2: ${r2Key}`);
        
        const obj = await env.GAMES.get(r2Key);

        if (obj === null) {
          console.log(`File not found in R2: ${r2Key}`);
          return new Response('Game file not found', { status: 404 });
        }

        // Get content type from object metadata or infer from extension
        const contentType = obj.httpMetadata?.contentType || getContentType(path);
        console.log(`Serving ${r2Key} with content-type: ${contentType}`);

        // Return the file from R2 with proper headers
        return new Response(obj.body, {
          headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=31536000',
            'access-control-allow-origin': '*'
          }
        });
      } catch (error) {
        console.error(`R2 fetch error for ${path}:`, error);
        return new Response('Error fetching game file', { status: 500 });
      }
    } else {
      console.log(`Serving ${gameDir} from Pages`);
    }
  }

  // If not a large game or not a game request, let Pages handle it
  return next();
}

// Helper function to determine content type
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
    'bin': 'application/octet-stream',
    'txt': 'text/plain'
  };
  
  return types[extension] || 'application/octet-stream';
}
