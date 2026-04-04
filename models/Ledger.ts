import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILedger extends Document {
    transactionId: Types.ObjectId;
    accountId: Types.ObjectId;
    entryType: 'Debit' | 'Credit';
    amount: Types.Decimal128;
    balanceAfter: Types.Decimal128;
    memo?: string;
    createdAt: Date;
    updatedAt: Date;
}

const LedgerSchema = new Schema<ILedger>({
    transactionId: { 
        type: Schema.Types.ObjectId, 
        ref: "Transaction", 
        required: true,
        index: true,
        immutable: true
    },
    accountId: { 
        type: Schema.Types.ObjectId, 
        ref: "Account", 
        required: true,
        index: true,
        immutable: true
    },
    entryType: { 
        type: String, 
        enum: ['Debit', 'Credit'],
        required: true,
        immutable: true
    },
    amount: { 
        type: Schema.Types.Decimal128, 
        required: true,
        min: [0.01, 'Amount must be strictly greater than zero'], 
        immutable: true
    },
    balanceAfter: { 
        type: Schema.Types.Decimal128, 
        required: true,
        immutable: true
    },
    memo: { 
        type: String, 
        immutable: true 
    }
}, { 
    timestamps: true 
});

LedgerSchema.index({ accountId: 1, _id: -1 });
LedgerSchema.index({ transactionId: 1 });

export default mongoose.models.Ledger || mongoose.model<ILedger>("Ledger", LedgerSchema);