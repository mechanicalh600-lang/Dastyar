
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { APP_VERSION } from '../constants';
import { Lock, User as UserIcon, Eye, EyeOff, LogIn, AlertCircle, Database, Copy, X, Check, Loader2, ShieldCheck, CheckCircle, HelpCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { clearMuseumSession, setMuseumSession, supabase } from '../supabaseClient';
import { DB_SETUP_SQL } from '../dbSchema';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset Password State
  const [isResetMode, setIsResetMode] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [resetCurrentPass, setResetCurrentPass] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Connection Diagnostic State
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionMsg, setConnectionMsg] = useState('');
  
  // SQL Modal
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase.rpc('museum_healthcheck');

      if (error || data !== true) throw error || new Error('Healthcheck failed');
      
      setConnectionStatus('connected');
      setConnectionMsg('ارتباط با سرور برقرار است');
    } catch (err: any) {
      console.error("Supabase Connection Error:", err);
      setConnectionStatus('error');
      
      let msg = "خطای ناشناخته در اتصال";
      if (typeof err === 'string') {
          msg = err;
      } else if (err?.code === '42P01') {
          msg = "جداول دیتابیس ساخته نشده‌اند";
      } else if (err?.message) {
          msg = err.message;
      } else {
          try {
              msg = JSON.stringify(err);
          } catch(e) {
              msg = "Unknown Error Object";
          }
      }
      
      setConnectionMsg(msg);
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(DB_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    clearMuseumSession();

    try {
        const { data, error } = await supabase.rpc('museum_login', {
            p_username: username,
            p_password: password,
        });

        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row?.session_token) {
            throw new Error('نام کاربری یا رمز عبور اشتباه است');
        }

        setMuseumSession(row.session_token);

        const dbUser: User = {
            id: row.id,
            username: row.username,
            fullName: row.full_name || row.username,
            role: row.role as UserRole,
            passwordHash: '***',
            isDefaultPassword: Boolean(row.is_default_password),
            personnelCode: row.personnel_code || undefined,
            avatar: row.avatar || undefined,
        };

        if (dbUser.isDefaultPassword) {
            setIsResetMode(true);
            setTempUser(dbUser);
            return;
        }

        onLogin(dbUser);

    } catch (err: any) {
        clearMuseumSession();
        console.warn('Login Failed:', err?.message);
        setError('نام کاربری یا رمز عبور اشتباه است');
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (resetNewPass !== resetConfirmPass) {
          setError('تکرار رمز عبور مطابقت ندارد');
          return;
      }
      if (resetCurrentPass !== password) {
          setError('رمز عبور فعلی اشتباه است');
          return;
      }
      if (resetNewPass === password) {
          setError('رمز عبور جدید نمی‌تواند مشابه رمز فعلی (پیش‌فرض) باشد');
          return;
      }

      setLoading(true);
      setError('');

      if (tempUser) {
          try {
              const { data, error } = await supabase.rpc('museum_change_password', {
                  p_current_password: resetCurrentPass,
                  p_new_password: resetNewPass,
              });

              if (error || data !== true) throw error || new Error('Password change rejected');

              setResetSuccess(true);
              setTimeout(() => {
                  clearMuseumSession();
                  setIsResetMode(false);
                  setResetSuccess(false);
                  setResetCurrentPass('');
                  setResetNewPass('');
                  setResetConfirmPass('');
                  setPassword(''); 
              }, 2000);

          } catch (err: any) {
              setError('خطا در تغییر رمز عبور: ' + (err?.message || 'خطای نامشخص'));
          } finally {
              setLoading(false);
          }
      }
  };

  const passwordsMatch = resetNewPass && resetConfirmPass && resetNewPass === resetConfirmPass;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden font-sans">
      
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#800020]/5 blur-3xl"></div>
          <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-sm z-10 flex flex-col gap-6">
        
        {/* Branding Section (Title) */}
        <div className="text-center flex flex-col items-center animate-fadeIn">
             <h1 className="text-lg md:text-xl font-black text-[#800020] dark:text-red-400 leading-tight mb-2 px-4 whitespace-nowrap">
                شرکت توسعه معدنی و صنعتی صبانور
             </h1>
             <p className="text-sm text-gray-600 dark:text-gray-300 font-bold tracking-wide">
                سامانه هوشمند نگهداری و تعمیرات
             </p>
        </div>

        {/* Logo Container */}
        <div className="flex justify-center mb-6 relative z-20 animate-fadeIn delay-100">
             <div className="w-36 h-36 flex items-center justify-center transform hover:scale-105 transition duration-700">
                <Logo className="w-full h-full drop-shadow-2xl" />
             </div>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 animate-slideUp border border-white/50 dark:border-gray-700/50 pt-10 relative">
            
            {/* Status Indicator Icon (Top Right) */}
            <div className="absolute top-4 right-4">
                {connectionStatus === 'checking' && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="در حال بررسی اتصال"></div>}
                {connectionStatus === 'connected' && <div className="w-2 h-2 bg-green-500 rounded-full" title="اتصال برقرار است"></div>}
                {connectionStatus === 'error' && (
                    <button onClick={() => setShowSql(true)} className="text-red-500 hover:text-red-700 transition" title={connectionMsg || "خطا در اتصال"}>
                        <HelpCircle className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isResetMode ? (
                 <form onSubmit={handlePasswordChange} className="space-y-5">
                    {resetSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fadeIn">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-green-700">تغییر رمز موفقیت‌آمیز بود</h3>
                            <p className="text-sm text-gray-500">در حال انتقال به صفحه ورود...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-4">
                                <div className="mx-auto w-12 h-12 bg-red-100 text-[#800020] rounded-full flex items-center justify-center mb-3">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">تغییر اجباری رمز عبور</h2>
                                <p className="text-xs text-gray-500 mt-1 px-4 leading-relaxed">
                                    برای امنیت بیشتر، لطفاً رمز عبور پیش‌فرض خود را تغییر دهید.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 mr-1">رمز عبور فعلی</label>
                                    <div className="relative">
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password" 
                                            placeholder="رمز فعلی..."
                                            value={resetCurrentPass}
                                            onChange={(e) => setResetCurrentPass(e.target.value)}
                                            className="w-full pr-10 pl-4 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none text-sm transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 mr-1">رمز عبور جدید</label>
                                    <div className="relative">
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="رمز جدید..."
                                            value={resetNewPass}
                                            onChange={(e) => setResetNewPass(e.target.value)}
                                            className="w-full pr-10 pl-4 h-12 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none text-sm transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 mr-1">تکرار رمز عبور جدید</label>
                                    <div className="relative">
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="تکرار رمز جدید..."
                                            value={resetConfirmPass}
                                            onChange={(e) => setResetConfirmPass(e.target.value)}
                                            className={`w-full pr-10 pl-4 h-12 bg-gray-50 dark:bg-gray-900/50 border rounded-xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none text-sm transition-all ${resetConfirmPass && !passwordsMatch ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                            required
                                        />
                                        {resetConfirmPass && (
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                {passwordsMatch ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                                            </div>
                                        )}
                                    </div>
                                    {resetConfirmPass && !passwordsMatch && (
                                        <p className="text-[10px] text-red-500 mr-1 animate-pulse">تکرار رمز عبور مطابقت ندارد</p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-xs text-center bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {error}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading || !passwordsMatch || !resetNewPass}
                                className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white h-12 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'ذخیره و ورود'}
                            </button>
                        </>
                    )}
                 </form>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Added Header to Login Box */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ورود به حساب کاربری</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">لطفا نام کاربری و رمز عبور خود را وارد کنید</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 mr-1">نام کاربری</label>
                            <div className="relative group">
                                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#800020] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="نام کاربری خود را وارد کنید"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pr-12 pl-4 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-100"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 mr-1">رمز عبور</label>
                            <div className="relative group">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#800020] transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="●●●●●"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pr-12 pl-12 h-14 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none transition-all text-gray-800 dark:text-gray-100 tracking-wider"
                                    style={{ fontFamily: showPassword ? 'inherit' : 'Verdana, sans-serif' }}
                                    required
                                    autoComplete="current-password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-0 top-0 bottom-0 px-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20 flex items-center justify-center gap-2 animate-shake">
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {error}
                    </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white h-14 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.98] shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                            <>
                                <span>ورود به سیستم</span>
                                <LogIn className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>

        <div className="text-center space-y-2 pb-6">
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-light opacity-80">
                <span>نسخه {APP_VERSION}</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium tracking-widest uppercase opacity-80">
                DESIGNED & DEVELOPED BY H.PARSA
            </p>
        </div>

      {/* SQL Modal */}
      {showSql && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                      <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                          <Database className="w-5 h-5 text-blue-600" />
                          اسکریپت ساخت دیتابیس
                      </h3>
                      <button onClick={() => setShowSql(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30 text-sm text-yellow-800 dark:text-yellow-200">
                      {connectionMsg && <div className="mb-2 font-bold text-red-600">{connectionMsg}</div>}
                      این کد را کپی کرده و در پنل <b>Supabase</b> بخش <b>SQL Editor</b> اجرا کنید تا جداول مورد نیاز ساخته شوند.
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-gray-900 text-gray-300 font-mono text-xs relative">
                      <pre>{DB_SETUP_SQL}</pre>
                      <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition"
                      >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'کپی شد' : 'کپی کد'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  </div>
  );
};