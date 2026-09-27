import mongoose from "mongoose";
import { ensureDnsResolves } from "@/lib/dns-fix";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "المتغيّر البيئي MONGODB_URI غير مُعرَّف. أضِف رابط MongoDB Atlas في ملف .env.local.",
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      // ضمان عمل DNS قبل الاتصال (بعض أجهزة ويندوز تكتشف خادمًا داخليًا لا يرد)
      await ensureDnsResolves();
      return mongoose.connect(MONGODB_URI as string, {
        bufferCommands: false,
      });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

