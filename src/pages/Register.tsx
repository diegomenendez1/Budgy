import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const navigate = useNavigate();
    const { register, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await register(email, password, name);
            if (error) throw error;
            navigate('/onboarding');
        } catch (error) {
            console.error("Registration Error:", error);
            setErrorMsg("Error al registrar: " + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        await signInWithGoogle();
        navigate('/onboarding');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <button
                    onClick={() => navigate('/welcome')}
                    className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Volver
                </button>

                <Card className="border-border bg-card shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            <User className="text-primary" size={24} />
                        </div>
                        <CardTitle className="text-2xl font-black text-foreground uppercase tracking-tight italic">Crea tu cuenta</CardTitle>
                        <CardDescription className="uppercase tracking-widest text-[10px] font-black text-muted-foreground">
                            Únete a Budgy y toma el control
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="text"
                                        placeholder="Nombre completo"
                                        className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                    <Input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Contraseña"
                                        className="pl-10 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? "Ocultar" : "Mostrar"}
                                    </button>
                                </div>
                            </div>

                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest py-6 rounded-2xl shadow-xl shadow-primary/20" type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="flex items-center gap-2">Crear Cuenta <CheckCircle size={16} /></div>}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground uppercase tracking-widest text-[10px] font-black">O continúa con</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-border bg-secondary hover:bg-muted text-foreground transition-all font-bold flex items-center justify-center gap-3 h-12"
                            onClick={handleGoogleSignUp}
                            disabled={isLoading}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continuar con Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <div className="text-sm text-gray-400">
                            ¿Ya tienes cuenta?{' '}
                            <button onClick={() => navigate('/login')} className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-xs transition-colors">
                                Iniciar Sesión
                            </button>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
};

export default Register;
