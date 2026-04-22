import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Branch from "@/models/Branches";

export async function GET() {
    try {
        await dbConnect();
        const branches = await Branch.find(
            { 
                currentStatus: "Active",
                "location.coordinates": { $exists: true } 
            },
            {
                branchName: 1,
                branchCode: 1,
                location: 1,
                address: 1,
                contactInfo: 1
            }
        );

        return NextResponse.json({ branches }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
