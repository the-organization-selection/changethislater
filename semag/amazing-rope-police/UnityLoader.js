class UnityGameLoader {
    constructor() {
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 2000;
        this.totalParts = 4;
        this.loadedParts = 0;
        this.retryAttempts = new Array(4).fill(0);
        this.chunks = [];
        this.CACHE_NAME = 'unity-game-cache-v1';
        this.createUI();
    }

    async checkCache() {
        try {
            const cache = await caches.open(this.CACHE_NAME);
            const cachedParts = [];
            
            for (let i = 1; i <= this.totalParts; i++) {
                const fileName = `spider.data.unityweb.part${i}`;
                const cachedResponse = await cache.match(fileName);
                if (cachedResponse) {
                    cachedParts.push(fileName);
                }
            }
            
            return cachedParts;
        } catch (error) {
            console.error('Cache check failed:', error);
            return [];
        }
    }

    async loadGame() {
        try {
            this.updateStatus('Checking cache...');
            const cachedParts = await this.checkCache();
            this.updateStatus(`Found ${cachedParts.length} cached parts`);
            await this.loadAllParts(cachedParts);
            await this.initializeUnity();
        } catch (error) {
            console.error('Game load failed:', error);
            this.updateStatus('Failed to load game', true);
            this.showRetryButton();
        }
    }

    async loadPart(index, isCached) {
        const fileName = `spider.data.unityweb.part${index + 1}`;
        
        while (this.retryAttempts[index] < this.MAX_RETRIES) {
            try {
                let response;
                let cache;

                if (isCached) {
                    cache = await caches.open(this.CACHE_NAME);
                    response = await cache.match(fileName);
                    this.updateStatus(`Loading part ${index + 1} from cache`);
                } else {
                    response = await fetch(fileName);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    // Cache the response
                    cache = await caches.open(this.CACHE_NAME);
                    await cache.put(fileName, response.clone());
                    this.updateStatus(`Caching part ${index + 1}`);
                }

                const reader = response.body.getReader();
                const contentLength = +response.headers.get('Content-Length') || 0;
                let receivedLength = 0;
                const chunks = [];

                while (true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    receivedLength += value.length;
                    
                    const progress = contentLength ? 
                        (receivedLength / contentLength) * 100 : 
                        (receivedLength / 1000000) * 100; // Estimate if no content length
                    this.updatePartProgress(index, Math.min(progress, 100));
                }

                const allChunks = new Uint8Array(receivedLength);
                let position = 0;
                for (const chunk of chunks) {
                    allChunks.set(chunk, position);
                    position += chunk.length;
                }

                this.chunks[index] = new Blob([allChunks]);
                this.loadedParts++;
                this.updatePartProgress(index, 100);
                return;

            } catch (error) {
                this.retryAttempts[index]++;
                this.updateStatus(`Retry ${this.retryAttempts[index]}/${this.MAX_RETRIES} for part ${index + 1}...`);
                
                // If cached load fails, try network
                if (isCached) {
                    this.updateStatus('Cache load failed, trying network...');
                    try {
                        return await this.loadPart(index, false);
                    } catch (networkError) {
                        throw networkError;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            }
        }
        throw new Error(`Failed to load part ${index + 1} after ${this.MAX_RETRIES} attempts`);
    }

    async loadAllParts(cachedParts) {
        const loadPromises = [];
        for (let i = 0; i < this.totalParts; i++) {
            const fileName = `spider.data.unityweb.part${i + 1}`;
            const isCached = cachedParts.includes(fileName);
            loadPromises.push(this.loadPart(i, isCached));
        }

        try {
            await Promise.all(loadPromises);
            this.updateStatus('All parts loaded successfully!');
        } catch (error) {
            throw new Error('Failed to load all parts');
        }
    }

    async clearCache() {
        try {
            await caches.delete(this.CACHE_NAME);
            this.updateStatus('Cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    createUI() {
        // Previous UI code remains the same
        // ... [previous UI creation code] ...

        // Add cache control button
        this.cacheButton = document.createElement('button');
        this.cacheButton.textContent = 'Clear Cache';
        this.cacheButton.style.cssText = `
            display: block;
            margin: 10px auto;
            padding: 8px 16px;
            background: #666;
            border: none;
            border-radius: 5px;
            color: white;
            cursor: pointer;
        `;
        this.cacheButton.onclick = () => this.clearCache();
        this.container.appendChild(this.cacheButton);
    }

    async initializeUnity() {
        if (this.loadedParts !== this.totalParts) {
            throw new Error('Not all parts are loaded');
        }

        const completeFile = new Blob(this.chunks, {type: 'application/octet-stream'});
        const dataUrl = URL.createObjectURL(completeFile);

        const gameConfig = {
            dataUrl: dataUrl,
            frameworkUrl: "spider.framework.js.unityweb",
            codeUrl: "spider.wasm.unityweb",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "DefaultCompany",
            productName: "Amazing Rope Police",
            productVersion: "1.0",
            showBanner: false
        };

        try {
            this.updateStatus('Initializing Unity...');
            const instance = await createUnityInstance(canvas, gameConfig, (progress) => {
                this.updateStatus(`Unity load progress: ${Math.round(progress * 100)}%`);
            });
            this.updateStatus('Game loaded successfully!');
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 1000);
        } catch (error) {
            throw new Error('Unity initialization failed: ' + error);
        }
    }

    // Previous UI methods remain the same
    updatePartProgress(index, progress) { /* ... */ }
    updateStatus(message, isError = false) { /* ... */ }
    showRetryButton() { /* ... */ }
}

// Feature detection for Cache API
if ('caches' in window) {
    window.addEventListener('load', () => {
        const loader = new UnityGameLoader();
        loader.loadGame();
    });
} else {
    console.warn('Cache API not supported, falling back to direct loading');
    // Fallback to non-caching version if needed
}
