import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// --- HELPER: MÃ HÓA MẬT KHẨU ---
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // 1. Cấu hình Session (Lưu phiên đăng nhập)
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pickleball_secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore, // Đảm bảo trong storage.ts có export sessionStore
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // 2. Chiến lược đăng nhập Local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, {
            message: "Sai tên đăng nhập hoặc mật khẩu",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // --- API ROUTES ---

  // Đăng ký tài khoản mới (Gồm cả Phone và ID Card)
  app.post(
    "/api/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          return res.status(400).send("Tên đăng nhập đã tồn tại");
        }

        const hashedPassword = await hashPassword(req.body.password);
        
        // Lấy thông tin manager hiện tại nếu có
        const currentUser = req.user as any;
        const userData: any = {
          ...req.body,
          password: hashedPassword,
        };
        
        // Nếu là manager đang tạo user, set managerId
        if (currentUser && currentUser.role === "manager") {
          userData.managerId = currentUser.id;
        }
        
        const newUser = await storage.createUser(userData);

        req.login(newUser, (err) => {
          if (err) return next(err);
          res.status(201).json(newUser);
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // Đăng nhập
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user)
        return res.status(401).send(info.message || "Đăng nhập thất bại");

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Đăng xuất
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Lấy thông tin user hiện tại (Dùng cho useAuth frontend)
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
