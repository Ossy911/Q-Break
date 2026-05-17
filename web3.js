/**
 * Q-Break: Web3 / Quip Network Integration (Mock)
 * Handles wallet connection and post-quantum smart account simulation.
 */

class QuipNetwork {
    constructor() {
        this.isConnected = false;
        this.isGuest = false;
        this.dailyBonusClaimed = localStorage.getItem('quip_daily_claimed') === 'true';
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

    const intelBtn = document.getElementById('instructions-toggle-btn');
    const intelModal = document.getElementById('instructions-modal');
    const closeIntelBtn = document.getElementById('close-modal-btn');

    if (intelBtn && intelModal) {
        intelBtn.addEventListener('click', () => {
            intelModal.classList.remove('hidden');
            if (window.gameAudio) window.gameAudio.playUIBlip();
        });
    }

    if (closeIntelBtn && intelModal) {
        closeIntelBtn.addEventListener('click', () => {
            intelModal.classList.add('hidden');
            if (window.gameAudio) window.gameAudio.playUIBlip();
        });
    }

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

    // Dynamic Cyber CSS Click Burst Particles Helper
    function createClickBurst(x, y) {
        const burstContainer = document.createElement('div');
        burstContainer.style.position = 'fixed';
        burstContainer.style.top = '0';
        burstContainer.style.left = '0';
        burstContainer.style.width = '100vw';
        burstContainer.style.height = '100vh';
        burstContainer.style.pointerEvents = 'none';
        burstContainer.style.zIndex = '9999';
        document.body.appendChild(burstContainer);

        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            p.style.width = '6px';
            p.style.height = '6px';
            p.style.borderRadius = '50%';
            const color = Math.random() > 0.5 ? 'var(--cyan)' : 'var(--magenta)';
            p.style.background = color;
            p.style.boxShadow = `0 0 8px ${color}`;
            p.style.transform = 'translate(-50%, -50%)';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 25 + Math.random() * 45;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            p.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`, opacity: 0 }
            ], {
                duration: 550,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                fill: 'forwards'
            });

            burstContainer.appendChild(p);
        }

        setTimeout(() => burstContainer.remove(), 600);
    }

    // Click UI sound and dynamic click burst injection
    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.tagName === 'BUTTON') {
            createClickBurst(e.clientX, e.clientY);
            if (window.gameAudio && e.target.id !== 'audio-toggle-btn') {
                window.gameAudio.playUIBlip();
            }
        }
    }, true);

    const dailyBtn = document.getElementById('daily-check-btn');

    // Restore Claimed Daily Status UI on load if persisted
    if (dailyBtn && window.quip.dailyBonusClaimed) {
        dailyBtn.textContent = 'DAILY NODE INTEGRITY SECURED (+2)';
        dailyBtn.style.borderColor = 'var(--green)';
        dailyBtn.style.color = 'var(--green)';
        dailyBtn.style.textShadow = '0 0 10px rgba(57, 255, 20, 0.4)';
        dailyBtn.disabled = true;
    }

    if (dailyBtn) {
        dailyBtn.addEventListener('click', async () => {
            dailyBtn.textContent = 'PERFORMING BLOCK INTEGRITY CHECK...';
            dailyBtn.disabled = true;
            
            const result = await window.quip.performNodeHealthCheck();
            if (result.success) {
                window.quip.dailyBonusClaimed = true;
                localStorage.setItem('quip_daily_claimed', 'true');
                dailyBtn.textContent = 'DAILY NODE INTEGRITY SECURED (+2)';
                dailyBtn.style.borderColor = 'var(--green)';
                dailyBtn.style.color = 'var(--green)';
                dailyBtn.style.textShadow = '0 0 10px rgba(57, 255, 20, 0.4)';
                
                // Triumph UI Sound!
                if (window.gameAudio) {
                    window.gameAudio.playVaultSecured();
                }
            }
        });
    }

    // Event delegation on walletStatus container (immune to dynamic innerHTML replacements!)
    walletStatus.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target) return;

        // 1. Connect Button Click
        if (target.id === 'connect-wallet-btn') {
            target.textContent = 'CONNECTING...';
            target.disabled = true;
            
            const account = await window.quip.connect();
            
            walletStatus.innerHTML = `
                <div class="account-card">
                    <span class="label">SECURE ACCOUNT ACTIVE</span>
                    <span class="value">${account.address}</span>
                    <button id="disconnect-wallet-btn" class="secondary-btn" style="padding: 0.3rem 1rem; font-size: 0.75rem; border-color: var(--magenta); color: var(--magenta); margin-top: 0.5rem; text-shadow: 0 0 10px rgba(255,0,255,0.2);">DISCONNECT</button>
                </div>
            `;
            
            if (dailyBtn) dailyBtn.classList.remove('hidden');
            startBtn.classList.remove('hidden');
        }

        // 2. Play as Guest Button Click
        if (target.id === 'guest-btn') {
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
                    <button id="disconnect-wallet-btn" class="secondary-btn" style="padding: 0.3rem 1rem; font-size: 0.75rem; border-color: var(--magenta); color: var(--magenta); margin-top: 0.5rem; text-shadow: 0 0 10px rgba(255,0,255,0.2);">DISCONNECT</button>
                </div>
            `;
            
            startBtn.classList.remove('hidden');
        }

        // 3. Disconnect Button Click
        if (target.id === 'disconnect-wallet-btn') {
            window.quip.isConnected = false;
            window.quip.isGuest = false;
            window.quip.account = null;
            
            // Restore Connect / Guest standard buttons
            walletStatus.innerHTML = `
                <button id="connect-wallet-btn" class="primary-btn">CONNECT QUIP ACCOUNT</button>
                <button id="guest-btn" class="secondary-btn" style="margin-top: 0.5rem;">PLAY AS GUEST</button>
            `;
            
            // Hide Start and Daily buttons
            startBtn.classList.add('hidden');
            if (dailyBtn) dailyBtn.classList.add('hidden');
        }
    });
});
