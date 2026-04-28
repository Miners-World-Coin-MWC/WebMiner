let deferredPrompt = null;

/*
|--------------------------------------------------------------------------
| Register Service Worker
|--------------------------------------------------------------------------
*/

if ('serviceWorker' in navigator) {

    window.addEventListener('load', async () => {

        try {

            const registration =
                await navigator.serviceWorker.register('/sw.js');

            console.log(
                'Service Worker Registered',
                registration
            );

        } catch (err) {

            console.error(
                'Service Worker Error',
                err
            );
        }
    });
}

/*
|--------------------------------------------------------------------------
| Install Prompt
|--------------------------------------------------------------------------
*/

window.addEventListener(
    'beforeinstallprompt',
    (e) => {

        e.preventDefault();

        deferredPrompt = e;

        showInstallButton();
    }
);

/*
|--------------------------------------------------------------------------
| Install Button
|--------------------------------------------------------------------------
*/

function showInstallButton() {

    let btn =
        document.getElementById('installBtn');

    if (!btn) {

        btn =
            document.createElement('button');

        btn.id = 'installBtn';

        btn.textContent =
            'Install App';

        btn.style.marginTop = '10px';

        btn.style.width = '100%';

        btn.style.padding = '12px';

        btn.style.borderRadius = '10px';

        btn.style.border = 'none';

        btn.style.cursor = 'pointer';

        btn.style.fontWeight = 'bold';

        btn.style.background =
            'linear-gradient(90deg,#00e5ff,#7c4dff)';

        btn.style.color = '#000';

        document
            .querySelector('.container')
            .appendChild(btn);

        btn.addEventListener(
            'click',
            installPWA
        );
    }
}

/*
|--------------------------------------------------------------------------
| Install PWA
|--------------------------------------------------------------------------
*/

async function installPWA() {

    if (!deferredPrompt) {
        return;
    }

    deferredPrompt.prompt();

    const result =
        await deferredPrompt.userChoice;

    console.log(
        'Install Result:',
        result.outcome
    );

    deferredPrompt = null;
}

const mwcLeaderboardRows =
    document.getElementById(
        'mwcLeaderboardRows'
    );

const advcLeaderboardRows =
    document.getElementById(
        'advcLeaderboardRows'
    );

/*
|--------------------------------------------------------------------------
| NORMALIZE WALLET
|--------------------------------------------------------------------------
*/

function normalizeWorker(worker = '') {

    /*
    |--------------------------------------------------------------------------
    | REMOVE WORKERNAME
    |--------------------------------------------------------------------------
    |
    | wallet.workername
    | becomes:
    | wallet
    |
    */

    return worker.split('.')[0];
}

/*
|--------------------------------------------------------------------------
| DEDUPE
|--------------------------------------------------------------------------
*/

function dedupeWorkers(data) {

    const map = new Map();

    for (const miner of data) {

        const wallet =
            normalizeWorker(
                miner.worker
            );

        const existing =
            map.get(wallet);

        if (!existing) {

            map.set(
                wallet,
                {
                    ...miner,

                    worker:
                        wallet
                }
            );

            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | MERGE BEST STATS
        |--------------------------------------------------------------------------
        */

        existing.lastHashrate =
            Math.max(
                existing.lastHashrate || 0,
                miner.lastHashrate || 0
            );

        existing.peakHashrate =
            Math.max(
                existing.peakHashrate || 0,
                miner.peakHashrate || 0
            );

        existing.jobsReceived =
            (existing.jobsReceived || 0)
            +
            (miner.jobsReceived || 0);

        existing.threads =
            Math.max(
                existing.threads || 0,
                miner.threads || 0
            );

        existing.lastSeen =
            Math.max(
                existing.lastSeen || 0,
                miner.lastSeen || 0
            );
    }

    return Array.from(map.values());
}

/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

function renderBoard(
    rowsEl,
    data
) {

    rowsEl.innerHTML = '';

    data.forEach(
        (miner, index) => {

        const row =
            document.createElement(
                'div'
            );

        row.className =
            'leaderboard-row';

        const online =
            Date.now()
            -
            (miner.lastSeen || 0)
            <
            60000;

        let rankClass = '';

        if (index === 0) {
            rankClass = 'gold';
        }

        else if (
            index === 1
        ) {
            rankClass = 'silver';
        }

        else if (
            index === 2
        ) {
            rankClass = 'bronze';
        }

        row.innerHTML = `

            <div class="rank ${rankClass}">
                #${index + 1}
            </div>

            <div class="worker">
                ${miner.worker}
            </div>

            <div>
                ${(miner.lastHashrate || 0).toFixed(3)} KH/s
            </div>

            <div>
                ${(miner.peakHashrate || 0).toFixed(3)} KH/s
            </div>

            <div>
                ${miner.jobsReceived || 0}
            </div>

            <div>
                ${miner.threads || 0}
            </div>

            <div class="${
                online
                    ? 'online'
                    : 'offline'
            }">

                ${
                    online
                        ? 'ONLINE'
                        : 'OFFLINE'
                }

            </div>

        `;

        rowsEl.appendChild(row);
    });
}

/*
|--------------------------------------------------------------------------
| LOAD
|--------------------------------------------------------------------------
*/

async function loadLeaderboard() {

    try {

        const res =
            await fetch(
                'http://localhost:3000/leaderboard'
            );

        const raw =
            await res.json();

        const mwc =
            dedupeWorkers(

                raw.filter(
                    x =>
                    x.algo ===
                    'yespowerMWC'
                )

            ).sort(
                (a, b) =>
                    (b.peakHashrate || 0)
                    -
                    (a.peakHashrate || 0)
            );

        const advc =
            dedupeWorkers(

                raw.filter(
                    x =>
                    x.algo ===
                    'yespowerADVC'
                )

            ).sort(
                (a, b) =>
                    (b.peakHashrate || 0)
                    -
                    (a.peakHashrate || 0)
            );

        renderBoard(
            mwcLeaderboardRows,
            mwc
        );

        renderBoard(
            advcLeaderboardRows,
            advc
        );

    } catch (err) {

        console.error(
            'Leaderboard Error:',
            err
        );
    }
}

/*
|--------------------------------------------------------------------------
| TAB SWITCHING
|--------------------------------------------------------------------------
*/

document
    .querySelectorAll(
        '.leaderboard-tab'
    )
    .forEach(button => {

    button.addEventListener(
        'click',
        () => {

        document
            .querySelectorAll(
                '.leaderboard-tab'
            )
            .forEach(
                b =>
                b.classList.remove(
                    'active'
                )
            );

        document
            .querySelectorAll(
                '.leaderboard-panel'
            )
            .forEach(
                p =>
                p.classList.remove(
                    'active'
                )
            );

        button.classList.add(
            'active'
        );

        const board =
            button.dataset.board;

        document
            .getElementById(
                board + 'Board'
            )
            .classList.add(
                'active'
            );
    });
});

/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

loadLeaderboard();

setInterval(
    loadLeaderboard,
    10000
);