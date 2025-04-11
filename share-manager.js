class ShareManager {
    constructor() {
        // Map for converting unsafe characters in Base64 string
        this.base64UrlMap = {
            '+': '-',
            '/': '_',
            '=': '.'
        };
    }

    // Encode game state as URL
    encodeGameState(gameState) {
        try {
            // Convert game state to JSON string
            const jsonString = JSON.stringify(gameState);
            
            // Encode JSON string to Base64
            let base64String = btoa(unescape(encodeURIComponent(jsonString)));
            
            // Convert to URL-safe characters
            base64String = base64String.replace(/[+/=]/g, (match) => this.base64UrlMap[match]);
            
            return base64String;
        } catch (error) {
            console.error('Failed to encode game state:', error);
            return null;
        }
    }

    // Decode game state from URL
    decodeGameState(encodedString) {
        if (!encodedString) return null;
        
        try {
            // Convert URL-safe characters back to original Base64 characters
            for (const [key, value] of Object.entries(this.base64UrlMap)) {
                const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                encodedString = encodedString.replace(regex, key);
            }
            
            // Decode Base64 and parse JSON
            const jsonString = decodeURIComponent(escape(atob(encodedString)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Failed to decode game state:', error);
            return null;
        }
    }

    // Extract game state from current URL hash
    getStateFromUrl() {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        
        return this.decodeGameState(hash);
    }

    // Save game state to URL hash
    saveStateToUrl(gameState) {
        const encodedState = this.encodeGameState(gameState);
        if (encodedState) {
            // Use replaceState to update URL without adding a new entry to browser history
            window.history.replaceState(null, null, `#${encodedState}`);
            return true;
        }
        return false;
    }

    // Remove game state from URL
    clearStateFromUrl() {
        window.history.replaceState(null, null, window.location.pathname);
        return true;
    }
}
