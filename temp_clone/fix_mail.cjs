const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');

if (!code.includes(" Mail ")) {
  code = code.replace("MessageCircle } from 'lucide-react';", "MessageCircle, Mail } from 'lucide-react';");
  fs.writeFileSync('src/components/views/LoginView.tsx', code);
  console.log("Mail imported.");
} else {
  console.log("Mail already imported?");
}
