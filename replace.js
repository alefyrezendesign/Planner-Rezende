const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/session\?\.user\?\.id/g, 'MY_USER_ID');
content = content.replace(/session\?\.user\.id/g, 'MY_USER_ID');
content = content.replace(/session\.user\.id/g, 'MY_USER_ID');
content = content.replace(/if \(!MY_USER_ID\) return;/g, '');
fs.writeFileSync('src/App.tsx', content);
