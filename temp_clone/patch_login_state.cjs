const fs = require('fs');
let code = fs.readFileSync('src/components/views/LoginView.tsx', 'utf8');

if (!code.includes("const [isLoading, setIsLoading] = useState(false);")) {
  code = code.replace("export default function LoginView() {", "export default function LoginView() {\n  const [isLoading, setIsLoading] = useState(false);\n  const handleGoogleLogin = async () => {\n    setIsLoading(true);\n    const res = await loginWithGoogleAdmin();\n    if (res.success) {\n      window.dispatchEvent(new Event('satset_auth_updated'));\n    } else {\n      setError('Bukan akun admin.');\n      setIsLoading(false);\n    }\n  };");
  fs.writeFileSync('src/components/views/LoginView.tsx', code);
}
