import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./skyplanDatabase.json', 'utf8'));

console.log(Object.keys(data.global_schedule['102'] || {}));
console.log(Object.keys(data.global_schedule['101'] || {}));
const crippaDates = Object.keys(data.global_schedule['102'] || {}).concat(Object.keys(data.global_schedule['101'] || {}));
for (const date of crippaDates) {
    const list = data.global_schedule['102']?.[date] || data.global_schedule['101']?.[date] || [];
    for (const a of list) {
        if (a.code === 'AVSEC' || a.details?.includes('AVSEC')) {
            console.log(date, a);
        }
    }
}
