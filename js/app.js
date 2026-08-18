let deferredPrompt = null;

/*
|--------------------------------------------------------------------------
| REGISTER SERVICE WORKER
|--------------------------------------------------------------------------
*/

if ('serviceWorker' in navigator) {

    window.addEventListener(
        'load',
        async () => {

            try {

                const registration =
                    await navigator.serviceWorker.register(
                        './sw.js'
                    );

                console.log(
                    'Service Worker Registered',
                    registration
                );

            } catch (err) {

                console.error(
                    'Service Worker Error:',
                    err
                );
            }
        }
    );
}

/*
|--------------------------------------------------------------------------
| INSTALL PROMPT
|--------------------------------------------------------------------------
*/

window.addEventListener(
    'beforeinstallprompt',
    e => {

        e.preventDefault();

        deferredPrompt = e;

        showInstallButton();
    }
);

/*
|--------------------------------------------------------------------------
| INSTALL BUTTON
|--------------------------------------------------------------------------
*/

function showInstallButton() {

    let btn =
        document.getElementById(
            'installBtn'
        );

    if (btn) {
        return;
    }

    btn =
        document.createElement(
            'button'
        );

    btn.id =
        'installBtn';

    btn.type =
        'button';

    btn.textContent =
        'Install App';

    const form =
        document.getElementById(
            'stratumForm'
        );

    if (form) {

        form.appendChild(
            btn
        );
    }

    btn.addEventListener(
        'click',
        installPWA
    );
}

/*
|--------------------------------------------------------------------------
| INSTALL PWA
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

/*
|--------------------------------------------------------------------------
| LEADERBOARD
|--------------------------------------------------------------------------
|
| There is currently no backend/API.
|
| Therefore there is no live public leaderboard yet.
|
| This function prevents the old:
|
|   loadLeaderboard is not defined
|
| error while keeping the leaderboard area clean.
|
|--------------------------------------------------------------------------
*/

function loadLeaderboard() {

    const mwcRows =
        document.getElementById(
            'mwcLeaderboardRows'
        );

    const advcRows =
        document.getElementById(
            'advcLeaderboardRows'
        );

    if (mwcRows) {

        mwcRows.innerHTML = `
            <div class="leaderboard-row">
                <div>#</div>
                <div>Leaderboard unavailable</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
                <div class="offline">
                    OFFLINE
                </div>
            </div>
        `;
    }

    if (advcRows) {

        advcRows.innerHTML = `
            <div class="leaderboard-row">
                <div>#</div>
                <div>Leaderboard unavailable</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
                <div class="offline">
                    OFFLINE
                </div>
            </div>
        `;
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
    .forEach(
        button => {

            button.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll(
                            '.leaderboard-tab'
                        )
                        .forEach(
                            b => {

                                b.classList.remove(
                                    'active'
                                );
                            }
                        );

                    document
                        .querySelectorAll(
                            '.leaderboard-panel'
                        )
                        .forEach(
                            panel => {

                                panel.classList.remove(
                                    'active'
                                );
                            }
                        );

                    button.classList.add(
                        'active'
                    );

                    const board =
                        button.dataset.board;

                    const panel =
                        document.getElementById(
                            board +
                            'Board'
                        );

                    if (panel) {

                        panel.classList.add(
                            'active'
                        );
                    }
                }
            );
        }
    );

/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

loadLeaderboard();