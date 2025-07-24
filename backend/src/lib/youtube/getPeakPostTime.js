"use strict";
/**
 * Peak Hour Detector for YouTube Shorts
 * Automatically calculates the best time to post based on engagement trends
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeakPostTime = getPeakPostTime;
function getPeakPostTime() {
    // Static peak engagement windows based on YouTube Shorts behavior
    const peakTimes = ['10:00 AM', '1:30 PM', '6:45 PM'];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Convert peak times to today's timestamps
    const todayPeakTimes = peakTimes.map(timeStr => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
            hour24 += 12;
        }
        else if (period === 'AM' && hours === 12) {
            hour24 = 0;
        }
        return new Date(today.getTime() + (hour24 * 60 + minutes) * 60 * 1000);
    });
    // Find the next available peak time slot
    let recommendedTime = null;
    // Check today's remaining slots
    for (const peakTime of todayPeakTimes) {
        if (peakTime > now) {
            recommendedTime = peakTime;
            break;
        }
    }
    // If no slots today, use tomorrow's first slot
    if (!recommendedTime) {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const [time, period] = peakTimes[0].split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
            hour24 += 12;
        }
        else if (period === 'AM' && hours === 12) {
            hour24 = 0;
        }
        recommendedTime = new Date(tomorrow.getTime() + (hour24 * 60 + minutes) * 60 * 1000);
    }
    return {
        recommendedTime: recommendedTime
    };
}
