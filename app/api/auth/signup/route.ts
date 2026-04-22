import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { backfillMissingCustomerIds } from "@/lib/customerId";

export async function POST(req: Request) {
    try {
        await dbConnect();
        await backfillMissingCustomerIds();
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields." },
                { status: 400 },
            );
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { message: "An account with this email already exists." },
                { status: 409 },
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "N/A";

        const createdUser = await User.create({
            firstName,
            lastName,
            email,
            passwords: [{ hash: hashedPassword }],
        });

        return NextResponse.json(
            {
                message:
                    "Account created successfully. Please log in to continue.",
                customerId: createdUser.customerId,
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error("Signup Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}
