const fs = require('fs');
let content = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf-8');

// The mangled emojis are represented by random characters, let's just strip everything non-ascii and not a Hindi letter
// Actually, it's safer to just replace specific known blocks.

// Remove emojis manually known in the file
const toRemove = ['dY%', 'dY^', 'dY', 'dY"?', 'dY?', '?'];
toRemove.forEach(str => {
    content = content.replace(new RegExp(str, 'g'), '');
});

// Any remaining 1 or 2 character weird strings inside standard tags
content = content.replace(/>dY[^<]*?</g, '><');
content = content.replace(/>\?\s*</g, '><');
content = content.replace(/>~.\s*</g, '><'); // Stars component?

// Let's replace the Stars component completely so it doesn't break
content = content.replace(/function Stars\(\{ rating \}\) \{.*?\}/s, 
  "function Stars({ rating }) { return <span>{[1,2,3,4,5].map(s => <span key={s} style={{color: s<=rating?'#f59e0b':'#e5e7eb'}}>★</span>)}</span>; }"
);

// Better card styling for premium feel
content = content.replace(/className="card (.*?)"/g, 'className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6 "');
content = content.replace(/className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6 p-4 (.*?)"/g, 'className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6 "');

// Fix TABS in ProfilePage
content = content.replace(/icon:\s*'.*?'/g, "icon:''");

fs.writeFileSync('src/pages/ProfilePage.jsx', content, 'utf-8');
console.log('Fixed profile page!');