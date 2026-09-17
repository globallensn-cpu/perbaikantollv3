const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');

if (!code.includes('loginWithGoogleAdmin')) {
  code = code.replace("import { Play, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';", "import { Play, Sparkles, ArrowRight, ShieldCheck, Mail } from 'lucide-react';\nimport { loginWithGoogleAdmin } from '../../lib/auth';");
  
  code = code.replace("const [isLoading, setIsLoading] = useState(false);", "const [isLoading, setIsLoading] = useState(false);\n  const handleGoogleLogin = async () => {\n    setIsLoading(true);\n    const res = await loginWithGoogleAdmin();\n    if (res.success) {\n      window.dispatchEvent(new Event('satset_auth_updated'));\n    } else {\n      setError('Bukan akun admin.');\n      setIsLoading(false);\n    }\n  };");
  
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
        
        <div className="flex items-center gap-4 mb-6">
           <div className="h-px bg-gray-200 flex-1"></div>
           <span className="text-gray-400 text-sm font-medium">ATAU KODE AKSES</span>
           <div className="h-px bg-gray-200 flex-1"></div>
        </div>
        
        <div className="relative">`);

  fs.writeFileSync('src/components/views/LoginView.tsx', code);
}
