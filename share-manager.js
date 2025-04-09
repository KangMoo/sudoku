class ShareManager {
    constructor() {
        // Base64 문자열에서 안전하지 않은 문자 변환을 위한 맵
        this.base64UrlMap = {
            '+': '-',
            '/': '_',
            '=': '.'
        };
    }

    // 게임 상태를 URL로 인코딩
    encodeGameState(gameState) {
        try {
            // 게임 상태를 JSON 문자열로 변환
            const jsonString = JSON.stringify(gameState);
            
            // JSON 문자열을 Base64로 인코딩
            let base64String = btoa(unescape(encodeURIComponent(jsonString)));
            
            // URL 안전한 문자로 변환
            base64String = base64String.replace(/[+/=]/g, (match) => this.base64UrlMap[match]);
            
            return base64String;
        } catch (error) {
            console.error('게임 상태 인코딩 실패:', error);
            return null;
        }
    }

    // URL에서 게임 상태 디코딩
    decodeGameState(encodedString) {
        if (!encodedString) return null;
        
        try {
            // URL 안전 문자를 원래 Base64 문자로 변환
            for (const [key, value] of Object.entries(this.base64UrlMap)) {
                const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                encodedString = encodedString.replace(regex, key);
            }
            
            // Base64 디코딩 후 JSON 파싱
            const jsonString = decodeURIComponent(escape(atob(encodedString)));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('게임 상태 디코딩 실패:', error);
            return null;
        }
    }

    // 현재 URL의 해시에서 게임 상태 추출
    getStateFromUrl() {
        const hash = window.location.hash.slice(1);
        if (!hash) return null;
        
        return this.decodeGameState(hash);
    }

    // 게임 상태를 URL 해시에 저장
    saveStateToUrl(gameState) {
        const encodedState = this.encodeGameState(gameState);
        if (encodedState) {
            // replaceState를 사용하여 방문 기록에 새 항목 추가 없이 URL 업데이트
            window.history.replaceState(null, null, `#${encodedState}`);
            return true;
        }
        return false;
    }

    // URL에서 게임 상태 제거
    clearStateFromUrl() {
        window.history.replaceState(null, null, window.location.pathname);
        return true;
    }
}
