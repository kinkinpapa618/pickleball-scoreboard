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
    <div className="h-[svh] w-full flex flex-col bg-background font-sans overflow-hidden">
      <header className="w-full bg-card/80 backdrop-blur-lg border-b border-border flex-none">
        <div className="text-center py-4">
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black italic tracking-tighter text-blue-600"
          >
            TRONGTAISO.COM
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-[8px] tracking-[0.5em] uppercase font-bold"
          >
            Referee Professional System
          </motion.p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] z-10"
        >
          <Card className="border-border shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted h-14 p-1">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-2xl transition-all font-black italic uppercase text-[10px]"
                  >
                    Đăng nhập
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-2xl transition-all font-black italic uppercase text-[10px]"
                  >
                    Đăng ký
                  </TabsTrigger>
                </TabsList>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                              <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase ml-1">
                                Username
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11 bg-muted border-border focus:border-blue-500 text-foreground rounded-xl transition-all placeholder:text-muted-foreground"
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
                              <FormLabel className="text-muted-foreground text-[10px] font-bold uppercase ml-1">
                                Mật khẩu
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  className="h-11 bg-muted border-border focus:border-blue-500 text-foreground rounded-xl transition-all"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 font-black italic uppercase transition-all mt-2 rounded-xl"
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
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }: { field: any }) => (
                              <FormItem>
                                <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground ml-1">
                                  User
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-muted border-border text-foreground text-xs rounded-lg"
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
                                <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground ml-1">
                                  Họ tên
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-muted border-border text-foreground text-xs rounded-lg"
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
                                <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground ml-1">
                                  SĐT
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-muted border-border text-foreground text-xs rounded-lg"
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
                                <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground ml-1">
                                  CCCD
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    className="h-9 bg-muted border-border text-foreground text-xs rounded-lg"
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
                              <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground ml-1">
                                Mật khẩu
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  className="h-9 bg-muted border-border text-foreground rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-11 font-black italic uppercase transition-all mt-2 rounded-xl"
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

          <p className="mt-4 text-center text-muted-foreground text-[8px] font-medium tracking-widest uppercase">
            Secure Access • Referee ID Required
          </p>
        </motion.div>
      </main>
    </div>
  );
}
