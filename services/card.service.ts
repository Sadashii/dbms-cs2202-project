import crypto from "crypto";
import Card from "@/models/Cards";
import Account from "@/models/Accounts";
import dbConnect from "@/lib/mongodb";

export class CardService {
    private static generateCardNumber(): string {
        return Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 10),
        ).join("");
    }

    public static maskCardNumber(cardNumber: string): string {
        return `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(-4)}`;
    }

    public static async createCard(userId: string, type: "debit" | "credit") {
        await dbConnect();

        const cardCount = await Card.countDocuments({
            userId,
            status: { $ne: "blocked" },
        });
        if (cardCount >= 5) {
            throw new Error(
                "Card limit reached (max 5 active/inactive cards allowed).",
            );
        }

        const account = await Account.findOne({
            userId,
            currentStatus: "Active",
        });
        if (!account) {
            throw new Error("Active account required to issue a card.");
        }

        const cardNumber = this.generateCardNumber();
        const rawCvv = Math.floor(100 + Math.random() * 900).toString();
        const cvvHash = crypto
            .createHash("sha256")
            .update(rawCvv)
            .digest("hex");

        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 5);

        const newCard = await Card.create({
            userId,
            accountId: account._id,
            cardNumber,
            expiryDate,
            cvvHash,
            type,
            status: "inactive",
        });

        return {
            _id: newCard._id,
            maskedNumber: this.maskCardNumber(cardNumber),
            expiryDate: newCard.expiryDate,
            type: newCard.type,
            status: newCard.status,
        };
    }

    public static async updateStatus(
        cardId: string,
        userId: string,
        newStatus: string,
    ) {
        await dbConnect();
        const card = await Card.findOne({ _id: cardId, userId });

        if (!card) throw new Error("Card not found");
        if (card.status === "blocked")
            throw new Error("Blocked cards cannot be modified");

        card.status = newStatus;
        await card.save();
        return card;
    }
}
