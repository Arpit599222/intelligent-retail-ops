import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Lock, 
  Mail, 
  Server, 
  Activity, 
  Users, 
  ArrowRight, 
  ShieldAlert,
  UserCheck,
  Shield,
  Briefcase,
  KeyRound,
  CheckCircle2,
  X
} from "lucide-react";
import { useAppStore, Role } from "@/store/useAppStore";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotPasswordMsg, setShowForgotPasswordMsg] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both credentials.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    const res = await useAppStore.getState().login(email, password);
    
    if (res.success && res.redirectUrl) {
      navigate(res.redirectUrl);
    } else {
      setIsLoading(false);
      setErrorMessage(res.code);
      useAppStore.getState().addToast(res.code, "error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      
      {/* Left Side - Branding (Enterprise Theme) */}
      <div className="hidden lg:flex lg:w-5/12 bg-background flex-col justify-between border-r border-border p-12 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-foreground rounded-md flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-background" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Logistics OS</h1>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground leading-tight mb-6">
            Real-Time Retail<br/>Operations Platform
          </h2>
          <p className="text-muted text-lg max-w-md">
            Enterprise-grade inventory tracking, workforce management, and logistics synchronization.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="bg-background border border-border p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-muted uppercase">System Uptime</span>
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">99.99%</div>
          </div>
          <div className="bg-background border border-border p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-muted uppercase">Live Sync</span>
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">Active</div>
          </div>
          <div className="bg-background border border-border p-4 rounded-lg col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-info" />
              <span className="text-xs font-semibold text-muted uppercase">Active Workforce</span>
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">4,892 <span className="text-sm font-sans font-normal text-muted ml-1">personnel</span></div>
          </div>
        </div>
      </div>

      {/* Right Side - Credentials Form & Role Grid */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <div className="mb-6 lg:hidden flex items-center gap-2 justify-center">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Logistics OS</h1>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">Sign In</h2>
            <p className="text-muted/90 text-[13px] mb-8">Select your organizational role and authenticate.</p>

            {/* Manual Card Selection Grid */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">
                Organizational Roster Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedRole("SUPER_ADMIN"); setErrorMessage(""); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:border-muted/50 cursor-pointer h-24 ${
                    selectedRole === "SUPER_ADMIN"
                      ? "border-foreground bg-surface shadow-[0_0_0_1px_var(--color-foreground)]"
                      : "border-border bg-background"
                  }`}
                >
                  <Shield className={`w-4 h-4 ${selectedRole === "SUPER_ADMIN" ? "text-foreground" : "text-muted"}`} />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Super Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole("STORE_MANAGER"); setErrorMessage(""); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:border-muted/50 cursor-pointer h-24 ${
                    selectedRole === "STORE_MANAGER"
                      ? "border-foreground bg-surface shadow-[0_0_0_1px_var(--color-foreground)]"
                      : "border-border bg-background"
                  }`}
                >
                  <UserCheck className={`w-4 h-4 ${selectedRole === "STORE_MANAGER" ? "text-foreground" : "text-muted"}`} />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Store Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedRole("OPERATIONS_STAFF"); setErrorMessage(""); }}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:border-muted/50 cursor-pointer h-24 ${
                    selectedRole === "OPERATIONS_STAFF"
                      ? "border-foreground bg-surface shadow-[0_0_0_1px_var(--color-foreground)]"
                      : "border-border bg-background"
                  }`}
                >
                  <Briefcase className={`w-4 h-4 ${selectedRole === "OPERATIONS_STAFF" ? "text-foreground" : "text-muted"}`} />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Worker Staff</span>
                </button>
              </div>
              {!selectedRole && (
                <span className="text-[10px] text-zinc-500 font-medium italic mt-2 block">
                  * No category selected. Defaulting to Super Admin checks.
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center gap-2 font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-bold uppercase tracking-wider">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email Address or Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    required 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50 transition-all shadow-sm" 
                    placeholder="employee@company.com" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-muted">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setShowForgotPasswordMsg(true); setErrorMessage(""); }}
                    className="text-xs text-brand-500 hover:text-brand-400 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    required 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50 transition-all shadow-sm" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {showForgotPasswordMsg && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs flex items-start gap-2 font-medium relative animate-fade-in">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
                  <div className="pr-4">
                    <span className="font-bold block mb-0.5">Recovery Instructions</span>
                    <span>Please contact your Store Manager or Super Admin to retrieve or reset your operational login credentials.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPasswordMsg(false)}
                    className="absolute top-2.5 right-2.5 text-amber-500/70 hover:text-amber-400 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-foreground hover:bg-foreground/90 text-background py-2.5 rounded-lg font-semibold text-[13px] flex items-center justify-center transition-all mt-6 h-11 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-6 text-xs text-muted">
            <p>Roster configurations are managed globally by the company headquarters.</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {useAppStore.getState().requiresPasswordChange && (
          <ForceChangePassword 
            userId={useAppStore.getState().pendingUserId!}
            email={email}
            tempPassword={password}
            onCancel={() => {
              useAppStore.setState({ requiresPasswordChange: false, pendingUserId: null });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ForceChangePassword({ userId, email, tempPassword, onCancel }: { userId: string; email: string; tempPassword: string; onCancel: () => void }) {
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasLength = newPass.length >= 8;
  const hasUpper = /[A-Z]/.test(newPass);
  const hasLower = /[a-z]/.test(newPass);
  const hasNumber = /\d/.test(newPass);
  const hasSpecial = /[\W_]/.test(newPass);
  
  const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && newPass === confirmPass && newPass !== tempPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setErrorMsg("Please ensure all password requirements are met.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg("");
    
    const res = await useAppStore.getState().firstLoginChangePassword(userId, tempPassword, newPass);
    if (res.success && res.redirectUrl) {
      navigate(res.redirectUrl);
    } else {
      setIsLoading(false);
      setErrorMsg(res.code || "Failed to change password.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-brand-600 p-6 text-white text-center">
          <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h2 className="text-xl font-bold">First Login Security</h2>
          <p className="text-sm opacity-80 mt-1">Please change your temporary password</p>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">New Password</label>
              <input 
                required 
                type="password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-foreground focus:outline-none focus:border-brand-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Confirm New Password</label>
              <input 
                required 
                type="password" 
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-foreground focus:outline-none focus:border-brand-500" 
              />
            </div>

            <div className="bg-background rounded p-3 text-xs space-y-2 border border-border">
              <p className="font-semibold text-foreground mb-1">Password Requirements:</p>
              <div className="flex gap-4">
                <div className="space-y-1">
                  <div className={`flex items-center gap-1.5 ${hasLength ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 8+ Characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase
                  </div>
                </div>
                <div className="space-y-1">
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Number
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Special Char
                  </div>
                  <div className={`flex items-center gap-1.5 ${newPass && newPass === confirmPass ? 'text-success' : 'text-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passwords Match
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-surface hover:bg-zinc-800 border border-border rounded text-foreground font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading || !isValid}
                className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 disabled:cursor-not-allowed text-white py-2 rounded font-medium text-sm transition-colors cursor-pointer flex justify-center items-center h-9"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Password"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
