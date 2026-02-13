import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
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
  Trophy,
  UserPlus,
  LogIn,
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
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden p-4">
      {/* Hiệu ứng tia sáng nền (Decorations) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-[450px] z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 mb-4 shadow-lg shadow-orange-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            Pickleball <span className="text-orange-500">Pro</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Hệ thống quản lý giải đấu chuyên nghiệp
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 rounded-none h-14">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-none transition-all"
                >
                  <LogIn className="w-4 h-4 mr-2" /> ĐĂNG NHẬP
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-none transition-all"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> ĐĂNG KÝ
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                {/* FORM ĐĂNG NHẬP */}
                <TabsContent value="login" className="mt-0 space-y-4">
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
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Tên đăng nhập
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                  className="pl-10 bg-white/5 border-white/10 focus:border-orange-500 text-white"
                                  placeholder="admin123"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Mật khẩu
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                className="bg-white/5 border-white/10 focus:border-orange-500 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 h-12 font-bold transition-all"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "VÀO HỆ THỐNG"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* FORM ĐĂNG KÝ */}
                <TabsContent value="register" className="mt-0">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit((data: InsertUser) =>
                        registerMutation.mutate(data),
                      )}
                      className="space-y-3"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Tên đăng nhập
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-white/5 border-white/10 text-white"
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
                            <FormLabel className="text-gray-300">
                              Họ và tên
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Nguyễn Văn A"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }: { field: any }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">
                                SĐT
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                  <Input
                                    className="pl-9 bg-white/5 border-white/10 text-white text-xs"
                                    {...field}
                                  />
                                </div>
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
                              <FormLabel className="text-gray-300">
                                CCCD
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                  <Input
                                    className="pl-9 bg-white/5 border-white/10 text-white text-xs"
                                    {...field}
                                  />
                                </div>
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
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Mật khẩu
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                className="bg-white/5 border-white/10 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 h-12 font-bold mt-4 shadow-lg shadow-orange-600/20"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "TẠO TÀI KHOẢN NGAY"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
