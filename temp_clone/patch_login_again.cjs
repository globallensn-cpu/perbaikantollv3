const fs = require('fs');
const path = 'src/components/views/LoginView.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { loginWithGoogleAdmin }")) {
  code = code.replace("import { Play, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';", "import { Play, Sparkles, ArrowRight, ShieldCheck, Mail } from 'lucide-react';\nimport { loginWithGoogleAdmin } from '../../lib/auth';\nimport { useState } from 'react';");
  code = code.replace("export default function LoginView() {", "export default function LoginView() {\n  const [isLoading, setIsLoading] = useState(false);\n  const handleGoogleLogin = async () => {\n    setIsLoading(true);\n    const res = await loginWithGoogleAdmin();\n    if (res.success) {\n      window.dispatchEvent(new Event('satset_auth_updated'));\n    } else {\n      setError('Bukan akun admin.');\n      setIsLoading(false);\n    }\n  };");
  code = code.replace("<div className=\"relative\">", `
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoading}
          type="button" 
          className="w-full flex justify-center items-center gap-2 py-3.5 px-4 mb-4 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
        >
          <Mail className="w-5 h-5 text-red-500" />
          Login as Admin (Google)
        </button>
        <div className="relative">`);
  fs.writeFileSync(path, code);
}
