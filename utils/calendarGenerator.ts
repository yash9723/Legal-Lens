import { saveAs } from 'file-saver';
import { Obligation } from '../types';

export const generateICS = (obligations: Obligation[], fileName: string) => {
    if (!obligations || obligations.length === 0) return;

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LegalLens//Contract Deadlines//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    obligations.forEach((ob, index) => {
        // Attempt to parse date (simple heuristic, can be improved)
        // If date parse fails, we default to today + 1 month or just exclude
        // For MVP, we'll try to set it as a TO-DO without specific time if extraction is fuzzy

        // Create a unique UID
        const uid = `${Date.now()}-${index}@legallens.ai`;

        icsContent += `BEGIN:VEVENT
UID:${uid}
SUMMARY:${ob.task}
DESCRIPTION:Deadline from Contract: ${fileName}. Penalty: ${ob.penalty}
DTSTART;VALUE=DATE:${new Date().toISOString().replace(/-/g, '').split('T')[0]}
DTEND;VALUE=DATE:${new Date().toISOString().replace(/-/g, '').split('T')[0]}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, `Deadlines-${fileName}.ics`);
};
