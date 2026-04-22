import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect  from "@/lib/mongodb"; // Ensure this path matches your DB connection file
import { verifyAuth } from "@/lib/auth"; 
import { backfillMissingCustomerIds, ensureUserHasValidCustomerId } from "@/lib/customerId";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await backfillMissingCustomerIds();

    // 1. Get the full decoded token payload
    const authPayload = verifyAuth(req.headers);
    
    // 2. Check if it's valid AND has the userId property
    if (!authPayload || !authPayload.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Search using JUST the ID string
    const user = await ensureUserHasValidCustomerId(authPayload.userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error: any) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    await backfillMissingCustomerIds();

    // 1. Get the full decoded token payload
    const authPayload = verifyAuth(req.headers);
    
    // 2. Check if it's valid AND has the userId property
    if (!authPayload || !authPayload.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, phone, address } = body;

    // 3. Search using JUST the ID string
    const user = await ensureUserHasValidCustomerId(authPayload.userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update basic details
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Update Address logic
    if (address) {
      const primaryIndex = user.addresses.findIndex((a: any) => a.isPrimary);
      
      if (primaryIndex >= 0) {
        // Update existing primary address
        user.addresses[primaryIndex].street = address.street;
        user.addresses[primaryIndex].city = address.city;
        user.addresses[primaryIndex].state = address.state;
        user.addresses[primaryIndex].zipCode = address.zipCode;
        user.addresses[primaryIndex].country = address.country;
        user.addresses[primaryIndex].updatedAt = new Date();
      } else {
        // Push a new primary address
        user.addresses.push({
          ...address,
          isPrimary: true,
          updatedAt: new Date()
        });
      }
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated", user }, { status: 200 });

  } catch (error: any) {
    console.error("PATCH Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
