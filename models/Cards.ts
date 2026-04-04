import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. Define the TypeScript interface
export interface ICard extends Document {
    cardReference: string;  
    userId: Types.ObjectId;
    accountId: Types.ObjectId; 
    
    cardType: 'Debit' | 'Credit' | 'Virtual';
    cardNetwork: 'Visa' | 'MasterCard' | 'RuPay' | 'Amex';
    
    // PCI-DSS Secure Data
    // MUST be a token from a PCI-compliant vault (like VGS, Marqeta) or AES-256 encrypted
    tokenizedNumber: string;      
    maskedNumber: string;    
    expiryDate: Date;
    // According to PCI-DSS, CVV should generally NOT be stored after authorization.
    // If you are the issuer, this must be a cryptographic hash or vault token.
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
    currentStatus: 'Inactive' | 'Active' | 'Blocked' | 'Lost' | 'Stolen' | 'Expired';
    
    metadata?: {
        issuedAt: Date;
        activatedAt?: Date;
        ipAddress?: string; 
        failureAttempts: number; 
    };

    statusHistory: Array<{
        state: 'Inactive' | 'Active' | 'Blocked' | 'Lost' | 'Stolen' | 'Expired';
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
        immutable: true // A card cannot change owners
    },
    accountId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Account', 
        required: true,
        index: true,
        immutable: true // The funding account cannot change once issued
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
    
    // PCI-DSS Adjustments
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
        immutable: true // Physical card expiration dates don't change
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
        enum: ['Inactive', 'Active', 'Blocked', 'Lost', 'Stolen', 'Expired'], 
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
            enum: ['Inactive', 'Active', 'Blocked', 'Lost', 'Stolen', 'Expired'],
            required: true
        },
        reason: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { 
    timestamps: true,
    // CRITICAL: Prevents race conditions for PIN failures and Credit limits
    optimisticConcurrency: true 
});

// --- Validation / Hooks ---

// 1. Cross-field validation for Credit vs Debit
CardSchema.pre('validate', function(next) {
    if (this.cardType !== 'Credit') {
        if (this.limits?.creditLimit != null) {
            this.invalidate('limits.creditLimit', 'Only Credit cards can have a credit limit.');
        }
        if (this.limits?.outstandingAmount != null && parseFloat(this.limits.outstandingAmount.toString()) > 0) {
            this.invalidate('limits.outstandingAmount', 'Debit/Virtual cards cannot have an outstanding balance.');
        }
    }
    
});

// 2. Automatically track card lifecycle changes
CardSchema.pre('save', function(next) {
    if (this.isModified('currentStatus')) {
        this.statusHistory.push({
            state: this.currentStatus,
            // If the service layer doesn't attach an updatedBy, we leave it blank. 
            // Defaulting it to this.userId is dangerous because admins/systems often block cards.
            updatedBy: this.statusHistory[this.statusHistory.length - 1]?.updatedBy, 
            updatedAt: new Date()
        });
        
        // Auto-set activation date if status changes to Active
        if (this.currentStatus === 'Active' && !this.metadata?.activatedAt) {
            // Using TypeScript non-null assertion or safe assignment
            if (!this.metadata) this.metadata = { failureAttempts: 0, issuedAt: new Date() };
            this.metadata.activatedAt = new Date();
        }
    }
    
});

// --- Indexes ---

// Find a user's active cards for the dashboard
CardSchema.index({ userId: 1, currentStatus: 1 });

// Daily cron job: Instantly find all cards expiring this month to trigger renewal logic
CardSchema.index({ currentStatus: 1, expiryDate: 1 });

// Note: Removed the `cardReference` index since `unique: true` handles it automatically.

export default mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);