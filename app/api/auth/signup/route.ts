import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
        }

        // Hash the password (Cost factor 12 is enterprise standard)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Split full name into first and last name
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "N/A";

        // Create the user (status defaults to Pending_KYC based on your Schema)
        await User.create({
            firstName,
            lastName,
            email,
            passwords: [{ hash: hashedPassword }],
        });

        return NextResponse.json(
            { message: "Account created successfully. Please log in to continue." },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Signup Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}