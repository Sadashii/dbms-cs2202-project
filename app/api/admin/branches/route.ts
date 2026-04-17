import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Branch from "@/models/Branches";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const isAdmin = async (request: Request) => {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
        
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string, role: string };
        
        return decoded.role === 'Admin';
    } catch {
        return false;
    }
};

export async function GET(request: Request) {
    try {
        if (!(await isAdmin(request))) {
            return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
        }
        await dbConnect();
        // Since we may not have actual User manager mappings easily, we omit populating for now
        const branches = await Branch.find().sort({ createdAt: -1 });
        return NextResponse.json({ branches }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!(await isAdmin(request))) {
            return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
        }
        await dbConnect();
        
        const body = await request.json();
        
        const newBranch = new Branch({
            branchCode: body.branchCode,
            branchName: body.branchName,
            branchType: body.branchType || 'Main',
            address: {
                street: body.address.street,
                city: body.address.city,
                state: body.address.state,
                zipCode: body.address.zipCode,
                country: body.address.country || 'India'
            },
            contactInfo: {
                email: body.contactInfo.email,
                phone: body.contactInfo.phone
            },
            operationalHours: body.operationalHours || [{ day: 'Monday', isOpen: true }],
            currentStatus: 'Active'
        });

        await newBranch.save();
        return NextResponse.json({ message: "Branch created successfully", branch: newBranch }, { status: 201 });
    } catch (error: any) {
        console.error(error);
        // Catch duplicate branch code
        if (error.code === 11000) {
            return NextResponse.json({ message: "A branch with this code already exists." }, { status: 400 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        if (!(await isAdmin(request))) {
            return NextResponse.json({ message: "Unauthorized. Admin access required." }, { status: 403 });
        }
        await dbConnect();
        
        const { branchId, currentStatus } = await request.json();
        
        if (!branchId || !currentStatus) {
            return NextResponse.json({ message: "Branch ID and new status are required" }, { status: 400 });
        }

        const validStatuses = ['Active', 'Maintenance', 'Temporarily_Closed', 'Permanently_Closed'];
        if (!validStatuses.includes(currentStatus)) {
            return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
        }

        const updatedBranch = await Branch.findById(branchId);
        if (!updatedBranch) {
            return NextResponse.json({ message: "Branch not found" }, { status: 404 });
        }

        updatedBranch.currentStatus = currentStatus;
        await updatedBranch.save(); // Triggers the schema .pre('save') middleware to log statusHistory

        return NextResponse.json({ message: "Branch status updated successfully", branch: updatedBranch }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
