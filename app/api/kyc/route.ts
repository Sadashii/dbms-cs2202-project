import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import KYC from "@/models/KYC";
import AccountRequest from "@/models/AccountRequests";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        
        // Fetch specific KYC records (PAN, Aadhar, etc.)
        const kycs = await KYC.find({ userId: decoded.userId }).sort({ createdAt: -1 });
        
        // Fetch the global Account Requests to see global status/account types
        const accountRequests = await AccountRequest.find({ userId: decoded.userId }).sort({ createdAt: -1 });

        return NextResponse.json({ 
            documents: kycs, 
            requests: accountRequests 
        });
    } catch (error) {
        console.error("KYC Fetch Error:", error);
        return NextResponse.json({ message: "Failed to fetch KYC status." }, { status: 500 });
    }
}
