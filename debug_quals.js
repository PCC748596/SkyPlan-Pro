import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./skyplanDatabase.json', 'utf8'));

const crippa101 = data.crew_data.find(c => c.id === '101');
const crippa102 = data.crew_data.find(c => c.id === '102');

console.log('CRIPPA (101):', crippa101?.name);
console.log('CRIPPA (101) Quals:', JSON.stringify(crippa101?.qualifications, null, 2));

console.log('CRIPPA (102):', crippa102?.name);
console.log('CRIPPA (102) Quals:', JSON.stringify(crippa102?.qualifications, null, 2));
