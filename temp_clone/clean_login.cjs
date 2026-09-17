const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');
code = code.replace("import { verifyAccessCode, verifyAccessCodeAsync, setUserSession, UserSession, loginWithGoogleAdmin } from '../../lib/auth';", "import { verifyAccessCode, verifyAccessCodeAsync, setUserSession, UserSession } from '../../lib/auth';");
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(false\);\s*const handleGoogleLogin = async \(\) => \{[\s\S]*?\};\n/, '');
fs.writeFileSync('src/components/views/LoginView.tsx', code);
