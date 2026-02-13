import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  LogIn,
  UserPlus,
  Phone,
  CreditCard,
  User,
} from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const loginForm = useForm({
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      phone: "",
      idCard: "",
      role: "referee",
    },
  });

  return (
    // Thêm h-[svh] và overflow-hidden để chặn cuộn toàn trang
    <div className="h-[svh] w-full flex flex-col bg-[#050505] font-sans overflow-hidden selection:bg-[#ccff00] selection:text-black">
      {/* HEADER CỐ ĐỊNH */}
      <header className="w-full bg-[#050505]/80 backdrop-blur-lg border-b border-white/5 flex-none">
        <div className="text-center py-4">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black italic tracking-tighter text-[#ccff00]"
          >
            TRONGTAISO.COM
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/40 text-[8px] tracking-[0.5em] uppercase font-bold"
          >
            Referee Professional System
          </motion.p>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH - Sử dụng flex-1 và justify-center để tự căn giữa */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        {/* Hiệu ứng ánh sáng nền để tăng chiều sâu mà ko làm tràn trang */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#ccff00]/5 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] z-10"
        >
          <Card className="bg-slate-900/40 border-white/5 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 h-14 p-1">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-[#ccff00] data-[state=active]:text-black rounded-2xl transition-all font-black italic uppercase text-[10px]"
                  >
                    Đăng nhập
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-[#ccff00] data-[state=active]:text-black rounded-2xl transition-all font-black italic uppercase text-[10px]"
                  >
                    Đăng ký
                  </TabsTrigger>
                </TabsList>

                {/* Giới hạn chiều cao vùng nội dung để tránh đẩy Card dài quá màn hình */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <TabsContent
                    value="login"
                    className="mt-0 space-y-4 outline-none"
                  >
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit((data: any) =>
                          loginMutation.mutate(data),
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }: { field: any }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-slate-400 text-[10px] font-bold uppercase ml-1">
                                Username
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11 bg-black/40 border-white/10 focus:border-[#ccff00] text-white rounded-xl transition-all placeholder:text-slate-600"
                                  placeholder="Tên tài khoản..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }: { field: any }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-slate-400 text-[10px] font-bold uppercase ml-1">
                                Mật khẩu
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  className="h-11 bg-black/40 border-white/10 focus:border-[#ccff00] text-white rounded-xl transition-all"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-[#ccff00] hover:bg-[#b3ff00] text-black h-12 font-black italic uppercase transition-all mt-2 rounded-xl"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Vào hệ thống"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0 outline-none">
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit((data: any) =>
                          registerMutation.mutate(data),
                        )}
                        className="space-y-3"
                      >
                        {/* Các trường đăng ký giữ nguyên, chỉ giảm padding/margin để tiết kiệm không gian */}
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] uppercase font-bold text-slate-400 ml-1">
                                  User
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-black/40 border-white/10 text-white text-xs rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="fullName"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] uppercase font-bold text-slate-400 ml-1">
                                  Họ tên
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-black/40 border-white/10 text-white text-xs rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={registerForm.control}
                            name="phone"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] uppercase font-bold text-slate-400 ml-1">
                                  SĐT
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-black/40 border-white/10 text-white text-xs rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="idCard"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] uppercase font-bold text-slate-400 ml-1">
                                  CCCD
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-black/40 border-white/10 text-white text-xs rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }: { field: any }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[9px] uppercase font-bold text-slate-400 ml-1">
                                Mật khẩu
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  className="h-9 bg-black/40 border-white/10 text-white rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-[#ccff00] hover:bg-[#b3ff00] text-black h-11 font-black italic uppercase transition-all mt-2 rounded-xl shadow-lg shadow-[#ccff00]/10"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Tạo tài khoản"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-slate-500 text-[8px] font-medium tracking-widest uppercase">
            Secure Access • Referee ID Required
          </p>
        </motion.div>
      </main>
    </div>
  );
}
