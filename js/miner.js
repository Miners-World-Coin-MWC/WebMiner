import * as cpuWebMiner from 'https://esm.run/@marco_ciaramella/cpu-web-miner@1.9.5?bundle';

let isMining = false;

let sessionStart = 0;

let highestHashrate = 0;
let currentHashrate = 0;

let jobsReceived = 0;
let jobsFailed = 0;

let pingInterval = null;

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const API_URL =
    'http://localhost:3000';

const API_KEY =
    'YOUR_SECRET_KEY';

/*
|--------------------------------------------------------------------------
| API HELPER
|--------------------------------------------------------------------------
*/

async function apiPost(endpoint, data) {

    const controller = new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            8000
        );

    try {

        const res = await fetch(
            API_URL + endpoint,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',

                    'x-api-key':
                        API_KEY
                },

                body: JSON.stringify(data),

                signal:
                    controller.signal
            }
        );

        clearTimeout(timeout);

        if (!res.ok) {
            throw new Error(
                `HTTP ${res.status}`
            );
        }

        return await res.json();

    } catch (err) {

        clearTimeout(timeout);

        console.error(
            'API Error:',
            err
        );

        return null;
    }
}

/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const output =
    document.getElementById('output');

const dot =
    document.getElementById('dot');

const statusText =
    document.getElementById('statusText');

const hashrateEl =
    document.getElementById('hashrate');

const peakHashrateEl =
    document.getElementById('peakHashrate');

const uptimeEl =
    document.getElementById('uptime');

const activeThreadsEl =
    document.getElementById('activeThreads');

const jobEl =
    document.getElementById('job');

const currentAlgoEl =
    document.getElementById('currentAlgo');

const minerStateEl =
    document.getElementById('minerState');

const threadsSelect =
    document.getElementById('threads');

const jobsReceivedEl =
    document.getElementById('jobsReceived');

const jobsFailedEl =
    document.getElementById('jobsFailed');

/*
|--------------------------------------------------------------------------
| THREADS
|--------------------------------------------------------------------------
*/

const maxThreads =
    navigator.hardwareConcurrency || 4;

for (let i = 1; i <= maxThreads; i++) {

    const option =
        document.createElement('option');

    option.value = i;

    option.textContent = i;

    if (i === maxThreads) {
        option.selected = true;
    }

    threadsSelect.appendChild(option);
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

    dot.classList.toggle('on', on);

    statusText.textContent =
        on ? 'Mining' : 'Idle';

    minerStateEl.textContent =
        on ? 'Connected' : 'Disconnected';

    document.getElementById(
        'miningBtn'
    ).textContent =
        on
            ? 'Stop Mining'
            : 'Start Mining';
}

/*
|--------------------------------------------------------------------------
| FORMAT TIME
|--------------------------------------------------------------------------
*/

function formatUptime(seconds) {

    const days =
        Math.floor(seconds / 86400);

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

    return `${days}d ${hrs}h ${mins}m ${secs}s`;
}

/*
|--------------------------------------------------------------------------
| UPTIME LOOP
|--------------------------------------------------------------------------
*/

setInterval(() => {

    if (!isMining) return;

    const uptime =
        Math.floor(
            (
                Date.now() -
                sessionStart
            ) / 1000
        );

    uptimeEl.textContent =
        formatUptime(uptime);

}, 1000);

/*
|--------------------------------------------------------------------------
| FORM
|--------------------------------------------------------------------------
*/

document
    .getElementById('stratumForm')
    .addEventListener(
        'submit',
        async (e) => {

        e.preventDefault();

        const worker =
            document.getElementById(
                'worker'
            ).value;

        /*
        |--------------------------------------------------------------------------
        | STOP
        |--------------------------------------------------------------------------
        */

        if (isMining) {

            await apiPost(
                '/miner/stop',
                {
                    worker,

                    peakHashrate:
                        highestHashrate,

                    jobsReceived,

                    jobsFailed
                }
            );

            cpuWebMiner.stop();

            setStatus(false);

            clearInterval(
                pingInterval
            );

            pingInterval = null;

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

        sessionStart = Date.now();

        highestHashrate = 0;

        currentHashrate = 0;

        jobsReceived = 0;
        jobsFailed = 0;

        jobsReceivedEl.textContent =
            '0';

        jobsFailedEl.textContent =
            '0';

        /*
        |--------------------------------------------------------------------------
        | ALGO
        |--------------------------------------------------------------------------
        */

        const algoKey =
            document.getElementById(
                'algo'
            ).value;

        const algo =
            ALGORITHMS[algoKey];

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

        const stratum = {

            server:
                document
                    .getElementById(
                        'poolUrl'
                    )
                    .value
                    .replace(
                        /^stratum\+\w+:\/\//,
                        ''
                    ),

            port: parseInt(
                document
                    .getElementById(
                        'port'
                    ).value
            ),

            worker,

            password:
                document
                    .getElementById(
                        'password'
                    ).value,

            ssl:
                document
                    .getElementById(
                        'ssl'
                    ).checked
        };

        const threads =
            parseInt(
                document
                    .getElementById(
                        'threads'
                    ).value
            );

        activeThreadsEl.textContent =
            threads;

        output.textContent =
            'Connecting...\n\n' +
            'Pool: ' +
            stratum.server +
            '\nAlgo: ' +
            algoKey;

        /*
        |--------------------------------------------------------------------------
        | START MINER
        |--------------------------------------------------------------------------
        */

        cpuWebMiner.start(

            algo,

            stratum,

            null,

            threads,

            /*
            |--------------------------------------------------------------------------
            | WORK
            |--------------------------------------------------------------------------
            */

            work => {

                const w =
                    work?.work || work;

                jobsReceived++;

                jobsReceivedEl.textContent =
                    jobsReceived;

                jobEl.textContent =
                    (
                        w.jobId || '-'
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
            | HASHRATE
            |--------------------------------------------------------------------------
            */

            hash => {

                const h =
                    Number(
                        hash?.hashrateKHs ??
                        hash?.hashrate ??
                        0
                    );

                currentHashrate = h;

                const khs =
                    h.toFixed(3);

                hashrateEl.textContent =
                    `${khs} KH/s`;

                if (
                    h >
                    highestHashrate
                ) {
                    highestHashrate = h;
                }

                peakHashrateEl.textContent =
                    `${highestHashrate.toFixed(3)} KH/s`;
            },

            /*
            |--------------------------------------------------------------------------
            | ERROR
            |--------------------------------------------------------------------------
            */

            err => {

                console.error(err);

                jobsFailed++;

                jobsFailedEl.textContent =
                    jobsFailed;

                output.textContent =
                    'Error:\n\n' +
                    err;

                setStatus(false);
            }
        );

        setStatus(true);

        /*
        |--------------------------------------------------------------------------
        | BACKEND START
        |--------------------------------------------------------------------------
        */

        await apiPost(
            '/miner/start',
            {
                worker,

                pool:
                    stratum.server +
                    ':' +
                    stratum.port,

                algo:
                    algoKey,

                threads
            }
        );

        /*
        |--------------------------------------------------------------------------
        | PING LOOP
        |--------------------------------------------------------------------------
        */

        if (pingInterval) {
            clearInterval(
                pingInterval
            );
        }

        pingInterval =
            setInterval(() => {

            if (!isMining) {
                return;
            }

            apiPost(
                '/miner/ping',
                {
                    worker,

                    hashrate:
                        currentHashrate
                }
            );

        }, 30000);
    });