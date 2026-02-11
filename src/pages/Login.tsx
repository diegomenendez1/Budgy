import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const { signInWithGoogle } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: Implement email/password login in AuthContext if not exists
        console.log("Login with email not implemented yet in this demo, use Google or Guest");
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background gradients */}
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white pl-0 hover:bg-transparent" onClick={() => navigate('/welcome')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>

                <Card className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                            <Lock className="w-6 h-6 text-indigo-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Bienvenido de nuevo</CardTitle>
                        <CardDescription>Ingresa a tu cuenta para continuar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="pl-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">¿Olvidaste tu contraseña?</a>
                            </div>
                            <Button type="submit" variant="premium" className="w-full h-12 text-base shadow-indigo-500/20" disabled={loading}>
                                {loading ? 'Cargando...' : 'Entrar'}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-black/50 px-2 text-muted-foreground text-gray-500">O continúa con</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all" onClick={handleGoogleLogin} disabled={loading}>
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continuar con Google
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center pb-6">
                        <div className="text-sm text-gray-400">
                            ¿No tienes cuenta? <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium transition-colors" onClick={() => navigate('/register')}>Regístrate</span>
                        </div>
                    </CardFooter>
                </Card>

            </motion.div>
        </div>
    )
}

export default Login;
