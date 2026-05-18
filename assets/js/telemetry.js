/**
 * UI Telemetry Engine & Performance Monitor
 * Autor: Tarîța Stanislav | Expert RC 251
 * Data: 18.05.2026 | No-Dependency GDPR Beacon
 */

(function() {
    'use strict';

    // Inițializarea obiectului de telemetrie
    const telemetryData = {
        appId: typeof __app_id !== 'undefined' ? __app_id : 'RC251-UTM-PORTFOLIO',
        timestamp: new Date().toISOString(),
        environment: {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
            deviceMemory: navigator.deviceMemory || 'N/A',
            networkType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
        },
        performanceMetrics: {},
        errors: [],
        interactions: {}
    };

    // -------------------------------------------------------------------------
    // 1. COLECTARE METRICI DE PERFORMANȚĂ
    // -------------------------------------------------------------------------
    function collectPerformanceMetrics() {
        if (!window.performance || !window.performance.getEntriesByType) return;

        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const timing = navEntries[0];
            telemetryData.performanceMetrics.dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
            telemetryData.performanceMetrics.tcpHandshake = timing.connectEnd - timing.connectStart;
            telemetryData.performanceMetrics.ttfb = timing.responseStart - timing.requestStart;
            telemetryData.performanceMetrics.domInteractive = timing.domInteractive;
            telemetryData.performanceMetrics.loadEvent = timing.loadEventEnd - timing.loadEventStart;
        }

        const paintEntries = window.performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
            if (entry.name === 'first-paint') {
                telemetryData.performanceMetrics.firstPaint = entry.startTime;
            } else if (entry.name === 'first-contentful-paint') {
                telemetryData.performanceMetrics.firstContentfulPaint = entry.startTime;
            }
        });

        dispatchTelemetry();
    }

    // -------------------------------------------------------------------------
    // 2. DYNAMIC ERROR TRACKING (window.onerror)
    // Captează orice eroare JS de pe pagină și trimite automat un beacon
    // -------------------------------------------------------------------------
    window.onerror = function(message, source, lineno, colno, error) {
        const errorData = {
            message: message,
            source: source,
            line: lineno,
            column: colno,
            stack: error ? error.stack : 'N/A',
            timestamp: new Date().toISOString()
        };

        telemetryData.errors.push(errorData);

        console.log("%c[TELEMETRIE ERROR] Eroare capturată:", "color: #ff4444; font-weight: bold;", errorData);

        // Trimite beacon imediat la detectarea erorii
        dispatchTelemetry();

        // Returnează false pentru a nu suprima eroarea în consolă
        return false;
    };

    // -------------------------------------------------------------------------
    // 3. CORE WEB VITALS — FID ESTIMATION (First Input Delay)
    // Măsoară timpul dintre click-ul fizic și execuția handler-ului
    // -------------------------------------------------------------------------
    let fidMeasured = false;

    function measureFID(event) {
        if (fidMeasured) return;
        fidMeasured = true;

        // Momentul fizic al click-ului (înregistrat de browser)
        const eventTimestamp = event.timeStamp;

        // Momentul execuției efective a handler-ului
        const handlerTimestamp = performance.now();

        // Diferența = First Input Delay estimat
        const fid = handlerTimestamp - eventTimestamp;

        telemetryData.interactions.firstInputDelay = fid;
        telemetryData.interactions.firstClickTime = new Date().toISOString();

        console.log("%c[TELEMETRIE FID] First Input Delay estimat:", "color: #ffaa00; font-weight: bold;", `${fid.toFixed(2)}ms`);

        // Trimite beacon cu datele FID
        dispatchTelemetry();

        // Eliminăm listener-ul după primul click
        document.removeEventListener('click', measureFID);
    }

    document.addEventListener('click', measureFID);

    // -------------------------------------------------------------------------
    // 4. TRIMITEREA DATELOR (sendBeacon + fallback XHR)
    // -------------------------------------------------------------------------
    function dispatchTelemetry() {
        const payload = JSON.stringify(telemetryData);
        const endpoint = "https://analytics.rc251.utm.md/api/telemetry";

        console.log("%c[TELEMETRIE ACTIVE] Structură JSON trimisă:", "color: #00f2ff; font-weight: bold;", telemetryData);

        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, payload);
        } else {
            // Fallback pentru browsere legacy fără suport sendBeacon
            const xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(payload);
        }
    }

    // -------------------------------------------------------------------------
    // 5. LIGHTHOUSE OPTIMIZATION — requestIdleCallback
    // Amână execuția scriptului până când browserul este complet liber
    // Previne scăderea scorului de Performanță sub 90%
    // -------------------------------------------------------------------------
    window.addEventListener('load', function() {
        if (typeof requestIdleCallback === 'function') {
            // Browserul suportă requestIdleCallback — amânăm până la idle
            requestIdleCallback(function() {
                setTimeout(collectPerformanceMetrics, 500);
            }, { timeout: 3000 }); // Timeout maxim 3 secunde
        } else {
            // Fallback pentru browsere fără suport requestIdleCallback (ex: Safari vechi)
            setTimeout(collectPerformanceMetrics, 500);
        }
    });

})();