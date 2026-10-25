const fs = require('fs');
let content = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf-8');

// Replace standard emojis with SVGs or empty strings
content = content.replace(/icon:\s*'.*?'/g, "icon:''"); // Remove mangled icons from POINT_TIERS

// Since the file has Windows encoding mangled emojis, let's remove everything that is not a basic ASCII/Hindi character.
// Or safely:
content = content.replace(/dY\[\^<\]\*\?/g, '');
content = content.replace(/>\s*dY[^<]*?\s*</g, '><'); 

// Let's replace the Stars component completely so it doesn't break
const starComp = 'function Stars({ rating }) { return <div className="flex gap-1">{[1,2,3,4,5].map(s => <svg key={s} className={w-4 h-4  + (s<=rating?	ext-amber-400:	ext-gray-200)} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}</div>; }';
content = content.replace(/function Stars\(\{ rating \}\) \{.*?\}/s, starComp);

// Better card styling for premium feel
content = content.replace(/className="card p-4/g, 'className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6');
content = content.replace(/className="card p-10/g, 'className="bg-white p-10 shadow-sm border border-gray-100 rounded-3xl mb-6');
content = content.replace(/className="card p-5/g, 'className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6');
content = content.replace(/className="card"/g, 'className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl mb-6"');

// Fix headers
content = content.replace(/text-gray-900 text-sm/g, 'text-gray-900 text-base font-semibold');

// Remove weird characters: 
content = content.replace(/dY\?\?/g, '');
content = content.replace(/dY"\?/g, '');
content = content.replace(/dY-\,\?/g, '');
content = content.replace(/dY\?/g, '');
content = content.replace(/-\?/g, '');

fs.writeFileSync('src/pages/ProfilePage.jsx', content, 'utf-8');
console.log('Fixed profile page!');