/**
 * Q-Break: Web3 / Quip Network Integration (Mock)
 * Handles wallet connection and post-quantum smart account simulation.
 */

class QuipNetwork {
    constructor() {
        this.isConnected = false;
        this.isGuest = false;
        this.account = null;
        this.networkId = 'quip-testnet-1';
        this.lastDailyCheck = null;
    }

    async connect() {
        this.isGuest = false;
        // Simulate wallet selection delay
        return new Promise(resolve => {
            setTimeout(() => {
                this.isConnected = true;
                this.account = {
                    address: '0xQ' + Math.random().toString(16).substring(2, 12).toUpperCase(),
                    type: 'PQ-Smart-Account',
                    security: 'NIST-P3'
                };
                console.log('Connected to Quip Network:', this.account);
                resolve(this.account);
            }, 1000);
        });
    }

    async commitScore(score, vaults) {
        console.log(`Committing score ${score} with ${vaults} vaults to Quip Network...`);
        return new Promise(resolve => {
            setTimeout(() => {
                const txHash = '0xTX' + Math.random().toString(16).substring(2, 20);
                resolve({ success: true, hash: txHash });
            }, 1500);
        });
    }

    async performNodeHealthCheck() {
        console.log('Performing Daily Node Health Check...');
        this.lastDailyCheck = Date.now();
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, bonusCharges: 5 });
            }, 800);
        });
    }
}

// Global instance
window.quip = new QuipNetwork();

// UI Integration
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const guestBtn = document.getElementById('guest-btn');
    const startBtn = document.getElementById('start-btn');
    const walletStatus = document.getElementById('wallet-status');
    const audioBtn = document.getElementById('audio-toggle-btn');

    // Audio Mute Toggle
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            if (window.gameAudio) {
                const enabled = window.gameAudio.toggleMute();
                audioBtn.textContent = enabled ? '🔊' : '🔇';
                window.gameAudio.playUIBlip();
            }
        });
    }

    // Interactive Button Hover/MouseEnter SFX delegation
    document.body.addEventListener('mouseenter', (e) => {
        if (e.target && e.target.tagName === 'BUTTON' && window.gameAudio) {
            window.gameAudio.playUIBlip();
        }
    }, true);

    // Click UI sound
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'BUTTON' && window.gameAudio && e.target.id !== 'audio-toggle-btn') {
            window.gameAudio.playUIBlip();
        }
    }, true);

    connectBtn.addEventListener('click', async () => {
        connectBtn.textContent = 'CONNECTING...';
        connectBtn.disabled = true;
        if (guestBtn) guestBtn.style.display = 'none';
        
        const account = await window.quip.connect();
        
        walletStatus.innerHTML = `
            <div class="account-card">
                <span class="label">SECURE ACCOUNT ACTIVE</span>
                <span class="value">${account.address}</span>
            </div>
        `;
        
        startBtn.classList.remove('hidden');
    });

    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            window.quip.isConnected = false;
            window.quip.isGuest = true;
            window.quip.account = {
                address: 'GUEST_OPERATOR',
                type: 'Guest-Session',
                security: 'None'
            };
            
            walletStatus.innerHTML = `
                <div class="account-card">
                    <span class="label" style="color: var(--magenta); text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);">GUEST SESSION ACTIVE</span>
                    <span class="value">UNREGISTERED_OPERATOR</span>
                </div>
            `;
            
            startBtn.classList.remove('hidden');
            connectBtn.style.display = 'none';
            guestBtn.style.display = 'none';
        });
    }
});
