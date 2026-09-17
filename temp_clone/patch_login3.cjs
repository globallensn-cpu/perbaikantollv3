const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');

if (!code.includes("loginWithGoogleAdmin")) {
  code = code.replace(
    "import { verifyAccessCode, verifyAccessCodeAsync, setUserSession, UserSession } from '../../lib/auth';",
    "import { verifyAccessCode, verifyAccessCodeAsync, setUserSession, UserSession, loginWithGoogleAdmin } from '../../lib/auth';"
  );
  
  if (!code.includes("Mail")) {
     code = code.replace("MessageCircle } from 'lucide-react';", "MessageCircle, Mail } from 'lucide-react';");
  }

  const handler = `
  const [isLoading, setIsLoading] = useState(false);
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const res = await loginWithGoogleAdmin();
    if (res.success && res.session) {
      window.dispatchEvent(new Event('satset_auth_updated'));
      onLoginSuccess(res.session);
    } else {
      setErrorMsg('Bukan akun admin.');
      setIsLoading(false);
    }
  };
`;

  code = code.replace("const [isSubmitting, setIsSubmitting] = useState(false);", "const [isSubmitting, setIsSubmitting] = useState(false);" + handler);
  
  const googleBtn = `
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
        <div className="relative">`;
  
  code = code.replace('<div className="relative">', googleBtn);

  fs.writeFileSync('src/components/views/LoginView.tsx', code);
}
