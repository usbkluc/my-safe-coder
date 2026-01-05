import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, Sparkles } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", password: "", confirmPassword: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({ title: "Chyba", description: "Vyplň meno a heslo", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const result = await login(loginData.username, loginData.password);
    setIsLoading(false);
    
    if (result.error) {
      toast({ title: "Chyba", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Vitaj späť! 🎉", description: "Úspešne prihlásený" });
      onOpenChange(false);
      setLoginData({ username: "", password: "" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.username || !signupData.password) {
      toast({ title: "Chyba", description: "Vyplň meno a heslo", variant: "destructive" });
      return;
    }
    
    if (signupData.username.length < 3) {
      toast({ title: "Chyba", description: "Meno musí mať aspoň 3 znaky", variant: "destructive" });
      return;
    }
    
    if (signupData.password.length < 4) {
      toast({ title: "Chyba", description: "Heslo musí mať aspoň 4 znaky", variant: "destructive" });
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({ title: "Chyba", description: "Heslá sa nezhodujú", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    const result = await signup(signupData.username, signupData.password);
    setIsLoading(false);
    
    if (result.error) {
      toast({ title: "Chyba", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Účet vytvorený! 🚀", description: "Vitaj v AI Programátor Ultimate" });
      onOpenChange(false);
      setSignupData({ username: "", password: "", confirmPassword: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Programátor Ultimate
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Prihlásenie</TabsTrigger>
            <TabsTrigger value="signup">Registrácia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Meno
                </Label>
                <Input
                  id="login-username"
                  placeholder="Tvoje meno"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Heslo
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Tvoje heslo"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Prihlasovanie...
                  </>
                ) : (
                  "Prihlásiť sa"
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Meno
                </Label>
                <Input
                  id="signup-username"
                  placeholder="Vyber si meno"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Heslo
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Vyber si heslo"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Potvrď heslo
                </Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="Zopakuj heslo"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vytváranie účtu...
                  </>
                ) : (
                  "Vytvoriť účet"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
