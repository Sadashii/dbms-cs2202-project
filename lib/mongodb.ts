import mongoose from "mongoose";

// The non-null assertion (!) tells TypeScript we've verified this exists
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Extend the NodeJS global type so TypeScript recognizes our cached connection
declare global {
    var mongoose: {
        conn: typeof import("mongoose") | null;
        promise: Promise<typeof import("mongoose")> | null;
    };
}

// Initialize the cached connection object
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    // If we already have a connection, return it immediately
    if (cached.conn) {
        return cached.conn;
    }

    // If a connection is not already being established, start one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable Mongoose buffering; fail fast if DB is down
            maxPoolSize: 50,       // Keep up to 50 socket connections open at once
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            return mongooseInstance;
        });
    }

    try {
        // Wait for the connection to resolve
        cached.conn = await cached.promise;
    } catch (e) {
        // If the connection fails, clear the promise so the app can try again on the next request
        cached.promise = null;
        console.error("MongoDB connection failed:", e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;