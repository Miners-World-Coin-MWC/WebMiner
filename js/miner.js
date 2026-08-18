import * as cpuWebMiner
    from 'https://esm.run/@marco_ciaramella/cpu-web-miner@1.9.5?bundle';

let isMining = false;

let sessionStart = 0;

let highestHashrate = 0;
let currentHashrate = 0;

let jobsReceived = 0;
let jobsFailed = 0;

/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const output =
    document.getElementById(
        'output'
    );

const dot =
    document.getElementById(
        'dot'
    );

const statusText =
    document.getElementById(
        'statusText'
    );

const hashrateEl =
    document.getElementById(
        'hashrate'
    );

const peakHashrateEl =
    document.getElementById(
        'peakHashrate'
    );

const uptimeEl =
    document.getElementById(
        'uptime'
    );

const activeThreadsEl =
    document.getElementById(
        'activeThreads'
    );

const jobEl =
    document.getElementById(
        'job'
    );

const currentAlgoEl =
    document.getElementById(
        'currentAlgo'
    );

const minerStateEl =
    document.getElementById(
        'minerState'
    );

const threadsSelect =
    document.getElementById(
        'threads'
    );

const jobsReceivedEl =
    document.getElementById(
        'jobsReceived'
    );

const jobsFailedEl =
    document.getElementById(
        'jobsFailed'
    );

/*
|--------------------------------------------------------------------------
| THREADS
|--------------------------------------------------------------------------
*/

const maxThreads =
    navigator.hardwareConcurrency || 4;

for (
    let i = 1;
    i <= maxThreads;
    i++
) {

    const option =
        document.createElement(
            'option'
        );

    option.value = i;

    option.textContent = i;

    if (i === maxThreads) {
        option.selected = true;
    }

    threadsSelect.appendChild(
        option
    );
}

/*
|--------------------------------------------------------------------------
| ALGORITHMS
|--------------------------------------------------------------------------
*/

const ALGORITHMS = {

    yespowerADVC:
        cpuWebMiner.yespowerADVC,

    yespowerMWC:
        cpuWebMiner.yespowerMWC

};

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

function setStatus(on) {

    isMining = on;

    dot.classList.toggle(
        'on',
        on
    );

    statusText.textContent =
        on
            ? 'Mining'
            : 'Idle';

    minerStateEl.textContent =
        on
            ? 'Connected'
            : 'Disconnected';

    document.getElementById(
        'miningBtn'
    ).textContent =
        on
            ? 'Stop Mining'
            : 'Start Mining';
}

/*
|--------------------------------------------------------------------------
| FORMAT UPTIME
|--------------------------------------------------------------------------
*/

function formatUptime(seconds) {

    const days =
        Math.floor(
            seconds / 86400
        );

    const hrs =
        Math.floor(
            (seconds % 86400) / 3600
        );

    const mins =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;

    return (
        `${days}d ` +
        `${hrs}h ` +
        `${mins}m ` +
        `${secs}s`
    );
}

/*
|--------------------------------------------------------------------------
| UPTIME
|--------------------------------------------------------------------------
*/

setInterval(
    () => {

        if (!isMining) {
            return;
        }

        const uptime =
            Math.floor(
                (
                    Date.now() -
                    sessionStart
                ) / 1000
            );

        uptimeEl.textContent =
            formatUptime(
                uptime
            );

    },
    1000
);

/*
|--------------------------------------------------------------------------
| MINING FORM
|--------------------------------------------------------------------------
*/

document
    .getElementById(
        'stratumForm'
    )
    .addEventListener(
        'submit',
        async e => {

            e.preventDefault();

            const worker =
                document.getElementById(
                    'worker'
                ).value.trim();

            /*
            |--------------------------------------------------------------------------
            | STOP MINING
            |--------------------------------------------------------------------------
            */

            if (isMining) {

                try {

                    cpuWebMiner.stop();

                } catch (err) {

                    console.error(
                        'Miner stop error:',
                        err
                    );
                }

                setStatus(false);

                output.textContent =
                    'Stopped';

                hashrateEl.textContent =
                    '0 KH/s';

                peakHashrateEl.textContent =
                    '0 KH/s';

                currentHashrate = 0;

                jobsReceived = 0;
                jobsFailed = 0;

                jobsReceivedEl.textContent =
                    '0';

                jobsFailedEl.textContent =
                    '0';

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | RESET SESSION
            |--------------------------------------------------------------------------
            */

            sessionStart =
                Date.now();

            highestHashrate = 0;
            currentHashrate = 0;

            jobsReceived = 0;
            jobsFailed = 0;

            jobsReceivedEl.textContent =
                '0';

            jobsFailedEl.textContent =
                '0';

            peakHashrateEl.textContent =
                '0 KH/s';

            /*
            |--------------------------------------------------------------------------
            | ALGORITHM
            |--------------------------------------------------------------------------
            */

            const algoKey =
                document.getElementById(
                    'algo'
                ).value;

            const algo =
                ALGORITHMS[
                    algoKey
                ];

            if (!algo) {

                output.textContent =
                    'Unsupported algorithm';

                return;
            }

            currentAlgoEl.textContent =
                algoKey;

            /*
            |--------------------------------------------------------------------------
            | STRATUM
            |--------------------------------------------------------------------------
            */

            const poolUrl =
                document.getElementById(
                    'poolUrl'
                ).value.trim();

            const port =
                parseInt(
                    document.getElementById(
                        'port'
                    ).value,
                    10
                );

            const password =
                document.getElementById(
                    'password'
                ).value;

            const ssl =
                document.getElementById(
                    'ssl'
                ).checked;

            /*
            |--------------------------------------------------------------------------
            | CLEAN POOL URL
            |--------------------------------------------------------------------------
            */

            const server =
                poolUrl.replace(
                    /^stratum\+\w+:\/\//i,
                    ''
                );

            /*
            |--------------------------------------------------------------------------
            | THREADS
            |--------------------------------------------------------------------------
            */

            const threads =
                parseInt(
                    document.getElementById(
                        'threads'
                    ).value,
                    10
                );

            activeThreadsEl.textContent =
                threads;

            /*
            |--------------------------------------------------------------------------
            | STRATUM CONFIG
            |--------------------------------------------------------------------------
            */

            const stratum = {

                server,

                port,

                worker,

                password,

                ssl
            };

            /*
            |--------------------------------------------------------------------------
            | UI
            |--------------------------------------------------------------------------
            */

            output.textContent =
                'Connecting...\n\n' +
                'Pool: ' +
                server +
                ':' +
                port +
                '\nAlgo: ' +
                algoKey +
                '\nWorker: ' +
                worker;

            /*
            |--------------------------------------------------------------------------
            | START CPU MINER
            |--------------------------------------------------------------------------
            */

            try {

                cpuWebMiner.start(

                    algo,

                    stratum,

                    null,

                    threads,

                    /*
                    |--------------------------------------------------------------------------
                    | WORK CALLBACK
                    |--------------------------------------------------------------------------
                    */

                    work => {

                        const w =
                            work?.work ||
                            work;

                        jobsReceived++;

                        jobsReceivedEl.textContent =
                            jobsReceived;

                        jobEl.textContent =
                            (
                                w?.jobId ||
                                '-'
                            ) +
                            ' [' +
                            algoKey +
                            ']';

                        output.textContent =
                            JSON.stringify(
                                w,
                                null,
                                2
                            );
                    },

                    /*
                    |--------------------------------------------------------------------------
                    | HASHRATE CALLBACK
                    |--------------------------------------------------------------------------
                    */

                    hash => {

                        const h =
                            Number(
                                hash?.hashrateKHs ??
                                hash?.hashrate ??
                                0
                            );

                        currentHashrate =
                            Number.isFinite(h)
                                ? h
                                : 0;

                        hashrateEl.textContent =
                            `${currentHashrate.toFixed(3)} KH/s`;

                        if (
                            currentHashrate >
                            highestHashrate
                        ) {

                            highestHashrate =
                                currentHashrate;
                        }

                        peakHashrateEl.textContent =
                            `${highestHashrate.toFixed(3)} KH/s`;
                    },

                    /*
                    |--------------------------------------------------------------------------
                    | ERROR CALLBACK
                    |--------------------------------------------------------------------------
                    */

                    err => {

                        console.error(
                            'Miner Error:',
                            err
                        );

                        jobsFailed++;

                        jobsFailedEl.textContent =
                            jobsFailed;

                        output.textContent =
                            'Mining Error:\n\n' +
                            String(err);

                        setStatus(false);
                    }
                );

                setStatus(true);

            } catch (err) {

                console.error(
                    'Failed to start miner:',
                    err
                );

                output.textContent =
                    'Failed to start miner:\n\n' +
                    String(err);

                setStatus(false);
            }
        }
    );