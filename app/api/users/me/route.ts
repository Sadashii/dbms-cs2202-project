import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import {
    backfillMissingCustomerIds,
    ensureUserHasValidCustomerId,
} from "@/lib/customerId";
import Session from "@/models/Session";

export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        if (!checkRateLimit(ip, "profile-get", 100, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many requests" },
                { status: 429 },
            );
        }
        await dbConnect();
        await backfillMissingCustomerIds();

        const authPayload = verifyAuth(req.headers);

        if (!authPayload || !authPayload.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const user = await ensureUserHasValidCustomerId(authPayload.userId);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const sessions = await Session.find({ userId: user._id }).sort({
            last_seen: -1,
        });

        return NextResponse.json({ user, sessions }, { status: 200 });
    } catch (error: any) {
        console.error("GET Profile Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        if (!checkRateLimit(ip, "profile-patch", 10, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: "Too many updates" },
                { status: 429 },
            );
        }
        await dbConnect();
        await backfillMissingCustomerIds();

        const authPayload = verifyAuth(req.headers);

        if (!authPayload || !authPayload.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await req.json();
        const { firstName, lastName, phone, address } = body;

        const user = await ensureUserHasValidCustomerId(authPayload.userId);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        if (address) {
            const primaryIndex = user.addresses.findIndex(
                (a: any) => a.isPrimary,
            );

            if (primaryIndex >= 0) {
                user.addresses[primaryIndex].street = address.street;
                user.addresses[primaryIndex].city = address.city;
                user.addresses[primaryIndex].state = address.state;
                user.addresses[primaryIndex].zipCode = address.zipCode;
                user.addresses[primaryIndex].country = address.country;
                user.addresses[primaryIndex].updatedAt = new Date();
            } else {
                user.addresses.push({
                    ...address,
                    isPrimary: true,
                    updatedAt: new Date(),
                });
            }
        }

        await user.save();

        return NextResponse.json(
            { message: "Profile updated", user },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("PATCH Profile Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
