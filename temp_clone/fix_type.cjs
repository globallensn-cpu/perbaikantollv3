const fs = require('fs');

const path = 'src/components/views/LoginView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import { loginWithGoogleAdmin } from '../../lib/auth';", "import { loginWithGoogleAdmin } from '../../lib/auth';\nimport { useState } from 'react';");
fs.writeFileSync(path, code);

