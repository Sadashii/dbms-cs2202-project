import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. Define the TypeScript interface
export interface ICard extends Document {
    cardReference: string;  
    userId: Types.ObjectId;
    accountId: Types.ObjectId; 
    
    cardType: 'Debit' | 'Credit' | 'Virtual';
    cardNetwork: 'Visa' | 'MasterCard' | 'RuPay' | 'Amex';
    
    // PCI-DSS Secure Data
    tokenizedNumber: string;      
    maskedNumber: string;    
    expiryDate: Date;
    cvvHash: string;             
    pinHash: string;         
    
    // Financial Limits & Capping
    limits: {
        dailyWithdrawalLimit: Types.Decimal128;
        dailyOnlineLimit: Types.Decimal128;
        contactlessLimit: Types.Decimal128;
        creditLimit?: Types.Decimal128;      
        outstandingAmount?: Types.Decimal128; 
    };

    currency: 'INR' | 'USD' | 'EUR';
    currentStatus: 'Inactive' | 'Active' | 'Frozen' | 'Blocked' | 'Lost' | 'Stolen' | 'Expired';
    
    metadata?: {
        issuedAt: Date;
        activatedAt?: Date;
        ipAddress?: string; 
        failureAttempts: number; 
    };

    statusHistory: Array<{
        state: 'Inactive' | 'Active' | 'Frozen' | 'Blocked' | 'Lost' | 'Stolen' | 'Expired';
        reason?: string;
        updatedBy?: Types.ObjectId; 
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

// 2. Define the Schema
const CardSchema = new Schema<ICard>({
    cardReference: { 
        type: String, 
        unique: true, 
        required: true,
        immutable: true,
        uppercase: true,
        trim: true
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true,
        immutable: true 
    },
    accountId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Account', 
        required: true,
        index: true,
        immutable: true 
    },
    cardType: { 
        type: String, 
        enum: ['Debit', 'Credit', 'Virtual'], 
        required: true,
        immutable: true 
    },
    cardNetwork: { 
        type: String, 
        enum: ['Visa', 'MasterCard', 'RuPay', 'Amex'], 
        required: true,
        immutable: true 
    },
    tokenizedNumber: { 
        type: String, 
        required: true, 
        unique: true,
        immutable: true,
        select: false 
    },
    maskedNumber: { 
        type: String, 
        required: true,
        immutable: true
    },
    expiryDate: { 
        type: Date, 
        required: true,
        immutable: true 
    },
    cvvHash: { 
        type: String, 
        required: true,
        immutable: true,
        select: false 
    },
    pinHash: { 
        type: String, 
        required: true,
        select: false 
    },
    limits: {
        dailyWithdrawalLimit: { type: Schema.Types.Decimal128, default: 50000.00, min: 0 },
        dailyOnlineLimit: { type: Schema.Types.Decimal128, default: 100000.00, min: 0 },
        contactlessLimit: { type: Schema.Types.Decimal128, default: 5000.00, min: 0 },
        creditLimit: { type: Schema.Types.Decimal128, min: 0 },
        outstandingAmount: { type: Schema.Types.Decimal128, default: 0.00, min: 0 }
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR'],
        immutable: true
    },
    currentStatus: { 
        type: String, 
        enum: ['Inactive', 'Active', 'Frozen', 'Blocked', 'Lost', 'Stolen', 'Expired'], 
        default: 'Inactive',
        index: true
    },
    metadata: {
        issuedAt: { type: Date, default: Date.now, immutable: true },
        activatedAt: { type: Date },
        ipAddress: { type: String },
        failureAttempts: { type: Number, default: 0, min: 0 }
    },
    statusHistory: [{
        state: { 
            type: String,
            enum: ['Inactive', 'Active', 'Frozen', 'Blocked', 'Lost', 'Stolen', 'Expired'],
            required: true
        },
        reason: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    optimisticConcurrency: true 
});

// --- Validation / Hooks ---

// 1. Cross-field validation for Credit vs Debit (Synchronous, NO next() needed)
CardSchema.pre('validate', function() {
    if (this.cardType !== 'Credit') {
        if (this.limits?.creditLimit != null) {
            this.invalidate('limits.creditLimit', 'Only Credit cards can have a credit limit.');
        }
        if (this.limits?.outstandingAmount != null && parseFloat(this.limits.outstandingAmount.toString()) > 0) {
            this.invalidate('limits.outstandingAmount', 'Debit/Virtual cards cannot have an outstanding balance.');
        }
    }
});

// 2. Automatically track card lifecycle changes (Synchronous, NO next() needed)
CardSchema.pre('save', function() {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: this.statusHistory[this.statusHistory.length - 1]?.updatedBy, 
            updatedAt: new Date()
        });
        
        // Auto-set activation date if status changes to Active for the first time
        if (this.currentStatus === 'Active' && (!this.metadata || !this.metadata.activatedAt)) {
            if (!this.metadata) {
                this.metadata = { failureAttempts: 0, issuedAt: new Date() };
            }
            this.metadata.activatedAt = new Date();
        }
    }
});

// --- Indexes ---
CardSchema.index({ userId: 1, currentStatus: 1 });
CardSchema.index({ currentStatus: 1, expiryDate: 1 });

export default mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);