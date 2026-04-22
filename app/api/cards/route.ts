import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Card from "@/models/Cards";
import Account from "@/models/Accounts";
import mongoose from "mongoose";
import crypto from "crypto";
import { verifyAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import * as bcrypt from "bcryptjs";

type SerializedCard = {
    currentStatus: string;
    limits?: {
        dailyWithdrawalLimit?: { toString(): string };
        dailyOnlineLimit?: { toString(): string };
        contactlessLimit?: { toString(): string };
        outstandingAmount?: { toString(): string };
        creditLimit?: { toString(): string };
    };
    isOnlineEnabled?: boolean;
    isInternationalEnabled?: boolean;
} & Record<string, unknown>;

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export async function GET() {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const cards = await Card.find({ userId: decoded.userId }).lean();

        const formattedCards = cards.map((rawCard) => {
            const card = rawCard as SerializedCard;

            return {
                ...card,
                currentStatus:
                    card.currentStatus === "Blocked"
                        ? "Frozen"
                        : card.currentStatus,
                limits: {
                    dailyWithdrawalLimit: parseFloat(
                        card.limits?.dailyWithdrawalLimit?.toString() ||
                            "50000",
                    ),
                    dailyOnlineLimit: parseFloat(
                        card.limits?.dailyOnlineLimit?.toString() || "100000",
                    ),
                    contactlessLimit: parseFloat(
                        card.limits?.contactlessLimit?.toString() || "5000",
                    ),
                    outstandingAmount: parseFloat(
                        card.limits?.outstandingAmount?.toString() || "0",
                    ),
                    creditLimit: parseFloat(
                        card.limits?.creditLimit?.toString() || "0",
                    ),
                },
                isOnlineEnabled: card.isOnlineEnabled ?? true,
                isInternationalEnabled: card.isInternationalEnabled ?? false,
            };
        });

        return NextResponse.json({ cards: formattedCards }, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json(
            { message: getErrorMessage(error, "Internal server error.") },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const body = await req.json();

        let { cardType, cardNetwork, accountId } = body;
        const { creditLimit } = body;
        if (!cardType || cardType === "Virtual") cardType = "Debit";
        if (!cardNetwork) cardNetwork = "Visa";

        if (cardType === "Debit" && !accountId) {
            const account = await Account.findOne({ userId: decoded.userId });
            if (account) accountId = account._id;
            else
                return NextResponse.json(
                    {
                        message:
                            "No active account found to link the debit card.",
                    },
                    { status: 400 },
                );
        }

        if (cardType === "Credit" && !creditLimit) {
            return NextResponse.json(
                { message: "Credit limit is required for credit cards." },
                { status: 400 },
            );
        }

        const rawPan = Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 10),
        ).join("");
        const maskedNumber = rawPan.slice(0, 4) + "********" + rawPan.slice(-4);
        const tokenizedNumber = crypto
            .createHash("sha256")
            .update(rawPan)
            .digest("hex");
        const cvvHash = crypto
            .createHash("sha256")
            .update(Math.floor(100 + Math.random() * 900).toString())
            .digest("hex");
        const pinHash = crypto
            .createHash("sha256")
            .update("1234")
            .digest("hex");

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 5);

        const newCard = await Card.create({
            cardReference: `CRD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            userId: decoded.userId,
            accountId: accountId || new mongoose.Types.ObjectId(),
            cardType: cardType,
            cardNetwork: cardNetwork,
            tokenizedNumber,
            maskedNumber,
            expiryDate,
            cvvHash,
            pinHash,
            currency: "INR",
            currentStatus: "Active",
            limits: {
                dailyWithdrawalLimit: 50000,
                dailyOnlineLimit: 100000,
                contactlessLimit: 5000,
                creditLimit: cardType === "Credit" ? creditLimit : undefined,
            },
        });

        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType: "CARD_ISSUED",
            category: "Financial",
            severity: "Medium",
            resource: "Card",
            resourceId: newCard._id,
            description: `New ${cardType} ${cardNetwork} card issued`,
            currentStatus: "Success",
            payload: {
                newState: JSON.stringify({
                    cardReference: newCard.cardReference,
                    cardType,
                    cardNetwork,
                    maskedNumber,
                    accountId,
                    creditLimit,
                }),
            },
        });

        return NextResponse.json(
            { message: "Card issued successfully.", card: newCard },
            { status: 201 },
        );
    } catch (error: unknown) {
        console.error("Card POST Error:", error);
        return NextResponse.json(
            { message: getErrorMessage(error, "Failed to create card in DB.") },
            { status: 500 },
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const body = await req.json();
        const { cardId, action, data, value } = body;

        const card = await Card.findOne({
            _id: cardId,
            userId: decoded.userId,
        }).select("+pinHash");
        if (!card)
            return NextResponse.json(
                { message: "Card not found." },
                { status: 404 },
            );

        const prevState = card.currentStatus;
        const prevLimits = JSON.parse(JSON.stringify(card.limits));

        if (action === "TOGGLE_STATUS") {
            if (card.currentStatus === "Closed") {
                return NextResponse.json(
                    { message: "Closed cards cannot be updated." },
                    { status: 400 },
                );
            }

            card.currentStatus =
                card.currentStatus === "Active" ? "Frozen" : "Active";
            await card.save();
        } else if (action === "TOGGLE_FEATURE") {
            const { feature } = data;
            if (feature === "online") {
                card.isOnlineEnabled = !card.isOnlineEnabled;
            } else if (feature === "international") {
                card.isInternationalEnabled = !card.isInternationalEnabled;
            } else {
                return NextResponse.json(
                    { message: "Invalid feature." },
                    { status: 400 },
                );
            }
            await card.save();
            return NextResponse.json({
                message: `Feature updated successfully.`,
            });
        } else if (action === "UPDATE_LIMITS") {
            card.limits.dailyOnlineLimit = data.onlineLimit;
            card.limits.dailyWithdrawalLimit = data.atmLimit;
            card.limits.contactlessLimit = data.contactlessLimit;
            await card.save();
        } else if (action === "CHANGE_PIN") {
            if (!value || !/^\d{4}$/.test(value)) {
                return NextResponse.json(
                    { message: "PIN must be exactly 4 digits." },
                    { status: 400 },
                );
            }

            card.pinHash = await bcrypt.hash(value, 10);
            await card.save();
        } else if (action === "DELETE_CARD") {
            if (!["Frozen", "Blocked"].includes(card.currentStatus)) {
                return NextResponse.json(
                    {
                        message:
                            "Card must be frozen before it can be permanently deleted.",
                    },
                    { status: 400 },
                );
            }

            if (
                card.cardType === "Credit" &&
                parseFloat(card.limits?.outstandingAmount?.toString() || "0") >
                    0
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Credit cards with an outstanding balance cannot be deleted.",
                    },
                    { status: 400 },
                );
            }

            await card.deleteOne();
        } else {
            return NextResponse.json(
                { message: "Invalid action." },
                { status: 400 },
            );
        }

        await createAuditLog({
            userId: decoded.userId,
            userRole: decoded.role,
            actionType:
                action === "DELETE_CARD"
                    ? "CARD_DELETED"
                    : action === "CHANGE_PIN"
                      ? "CARD_PIN_CHANGED"
                    : "CARD_STATUS_CHANGED",
            category: "Operational",
            severity: "Medium",
            resource: "Card",
            resourceId: cardId,
            description:
                action === "TOGGLE_STATUS"
                    ? `Card status changed from ${prevState} to ${card.currentStatus}`
                : action === "DELETE_CARD"
                  ? `Card ${card.cardReference} permanently deleted`
                : action === "CHANGE_PIN"
                  ? `Card PIN changed for ${card.cardReference}`
                : action === "UPDATE_LIMITS"
                  ? `Card limits updated`
                  : `Card updated`,
            currentStatus: "Success",
            payload: {
                previousState: JSON.stringify({
                    status: prevState,
                    limits: prevLimits,
                }),
                newState: JSON.stringify({
                    status:
                        action === "DELETE_CARD" ? "Deleted" : card.currentStatus,
                    limits:
                        action === "DELETE_CARD"
                            ? prevLimits
                            : card.limits,
                }),
            },
        });

        return NextResponse.json(
            {
                message:
                    action === "DELETE_CARD"
                        ? "Card permanently deleted."
                        : "Card updated successfully.",
                card: action === "DELETE_CARD" ? null : card,
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        console.error("Card PATCH Error:", error);
        return NextResponse.json(
            { message: getErrorMessage(error, "Internal server error.") },
            { status: 500 },
        );
    }
}
