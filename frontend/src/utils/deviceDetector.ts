export interface DeviceInfo {
    device: string;
    browser: string;
    os: string;
    type: 'mobile' | 'desktop' | 'tablet';
}

export const detectDevice = (): DeviceInfo => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";
    let device = "Unknown Device";
    let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';

    // Detect Browser
    if (ua.indexOf("Firefox") > -1) {
        browser = "Firefox";
    } else if (ua.indexOf("SamsungBrowser") > -1) {
        browser = "Samsung Internet";
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
        browser = "Opera";
    } else if (ua.indexOf("Trident") > -1) {
        browser = "Internet Explorer";
    } else if (ua.indexOf("Edge") > -1) {
        browser = "Edge";
    } else if (ua.indexOf("Chrome") > -1) {
        browser = "Chrome";
    } else if (ua.indexOf("Safari") > -1) {
        browser = "Safari";
    }

    // Detect OS
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("like Mac") > -1) os = "iOS";

    // Simple Mobile check
    if (/Mobi|Android/i.test(ua)) {
        type = 'mobile';
        device = "Mobile Device";
    } else {
        device = "Desktop PC";
    }

    // Refine Device Name
    if (os === "MacOS") device = "MacBook / iMac";
    if (os === "Windows") device = "Windows PC";
    if (os === "iOS") device = "iPhone / iPad";
    if (os === "Android") device = "Android Phone";

    return {
        device,
        browser,
        os,
        type
    };
};
